import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateCampaign, CreateCampaignDocument } from './entities/create-campaign.entity';
import { SmtpSender } from '../smtp-sender/entities/smtp-sender.entity';
import { ScheduleCampaign, ScheduleCampaignDocument } from '../schedule-campaign/entities/schedule-campaign.entity';
import { EmailLog, EmailLogDocument } from '../logs/schemas/email-log.schema';
import { Model } from 'mongoose';
import { throwException } from 'src/util/util/errorhandling';
import CustomError from 'src/provider/customer-error.service';
import CustomResponse from 'src/provider/custom-response.service';
import { MailService } from '../mail/mail.service';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
const csv = require('csv-parser');

@Injectable()
export class CreateCampaignService {
  constructor(
    @InjectModel(CreateCampaign.name)
    private campaignModel: Model<CreateCampaignDocument>,
    @InjectModel(SmtpSender.name)
    private smtpSenderModel: Model<SmtpSender>,
    @InjectModel(EmailLog.name)
    private emailLogModel: Model<EmailLogDocument>,
    @InjectModel(ScheduleCampaign.name)
    private scheduleModel: Model<ScheduleCampaignDocument>,
    @InjectQueue('campaign')
    private campaignQueue: Queue,
    private mailService: MailService,
  ) { }

  // ✅ BUILT-IN ROBUST PATH RESOLVER
  async parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      // 1. Get only the filename if a path was provided
      const fileName = path.basename(filePath);

      // 2. Always look inside the 'uploads' folder relative to project root
      const fullPath = path.join(process.cwd(), 'uploads', fileName);

      console.log('📂 Attempting to read file at:', fullPath);

      if (!fs.existsSync(fullPath)) {
        console.error(' File NOT found at:', fullPath);
        return reject(new NotFoundException(`File not found. Checked: ${fullPath}`));
      }

      fs.createReadStream(fullPath)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => {
          console.log(` Successfully parsed ${results.length} rows.`);
          resolve(results);
        })
        .on('error', (error: any) => {
          console.error(' Error parsing CSV:', error);
          reject(error);
        });
    });
  }

  async uploadCSV(file: Express.Multer.File) {
    try {
      const data = await this.parseCSV(file.path);
      const result = {
        filePath: file.path,
        fileName: file.filename,
        columns: Object.keys(data[0] || {}),
      };
      return new CustomResponse(200, 'CSV uploaded and parsed successfully', result);
    } catch (error) {
      throwException(new CustomError(error.status || 400, error.message));
    }
  }

  async mapFields(dto: any) {
    try {
      // Return everything provided in the DTO to allow dynamic mapping
      return new CustomResponse(200, 'Fields mapped successfully', dto);
    } catch (error) {
      throwException(new CustomError(500, error.message));
    }
  }

  async createFinalCampaign(dto: any, userId: string, workspaceId: string) {
    try {
      const data = await this.parseCSV(dto.filePath);

      const mappedContacts = data.map((row: any) => {
        const contact: any = {};
        
        // Dynamic mapping based on whatever fields were sent in the DTO
        // We exclude known non-mapping fields like filePath, name, subject, body, etc.
        const excludeFields = ['filePath', 'name', 'subject', 'body', 'status'];
        
        for (const [key, csvColumn] of Object.entries(dto)) {
          if (!excludeFields.includes(key) && typeof csvColumn === 'string') {
            contact[key] = row[csvColumn];
          }
        }

        // Ensure email is always present (compatibility with old emailField or new email)
        contact.email = row[dto.emailField] || row[dto.email] || row['Email'];
        
        return contact;
      });

      const campaign = await this.campaignModel.create({
        userId,
        workspaceId,
        name: dto.name || 'Untitled Campaign',
        subject: dto.subject,
        body: dto.body,
        status: dto.status || 'ACTIVE',
        contacts: mappedContacts,
        // Save the mapping for reference
        mapping: dto 
      });

      const result = {
        totalContacts: mappedContacts.length,
        campaign,
      };

      return new CustomResponse(201, 'Campaign created successfully', result);
    } catch (error) {
      throwException(new CustomError(error.status || 400, error.message));
    }
  }

  private async integrateDynamicStats(campaign: any, workspaceId: string) {
    const obj = campaign.toObject ? campaign.toObject() : { ...campaign };
    const total = await this.emailLogModel.countDocuments({ companyId: workspaceId, subject: obj.subject });
    const opened = await this.emailLogModel.countDocuments({ companyId: workspaceId, subject: obj.subject, status: { $in: ['OPENED', 'CLICKED'] } });
    const clicked = await this.emailLogModel.countDocuments({ companyId: workspaceId, subject: obj.subject, status: 'CLICKED' });

    obj.sent = total;
    obj.opened = opened;
    obj.replied = clicked; 
    obj.positiveReply = 0;
    obj.bounced = 0;
    obj.senderBounced = 0;

    return obj;
  }

  async findAll(workspaceId: string) {
    try {
      const campaigns = await this.campaignModel.find({ workspaceId }).sort({ createdAt: -1 });

      const campaignsWithStats = await Promise.all(
        campaigns.map(c => this.integrateDynamicStats(c, workspaceId))
      );

      return new CustomResponse(200, 'Campaigns fetched successfully', campaignsWithStats);
    } catch (error) {
      throwException(new CustomError(500, error.message));
    }
  }

  async findOne(id: string, workspaceId: string) {
    try {
      const campaign = await this.campaignModel.findOne({ _id: id, workspaceId });
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }

      const campaignWithStats = await this.integrateDynamicStats(campaign, workspaceId);

      return new CustomResponse(200, 'Campaign fetched successfully', campaignWithStats);
    } catch (error) {
      throwException(new CustomError(error.status || 400, error.message));
    }
  }

  async update(id: string, workspaceId: string, dto: any) {
    try {
      const campaign = await this.campaignModel.findOneAndUpdate(
        { _id: id, workspaceId },
        dto,
        { returnDocument: 'after' },
      );
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }
      return new CustomResponse(200, 'Campaign updated successfully', campaign);
    } catch (error) {
      throwException(new CustomError(error.status || 400, error.message));
    }
  }

  async remove(id: string, workspaceId: string) {
    try {
      const campaign = await this.campaignModel.findOneAndDelete({ _id: id, workspaceId });
      if (!campaign) {
        throw new NotFoundException('Campaign not found');
      }
      return new CustomResponse(200, 'Campaign deleted successfully', null);
    } catch (error) {
      throwException(new CustomError(error.status || 400, error.message));
    }
  }

  async sendTestEmail(dto: any, workspaceId: string) {
    try {
      const smtpId = dto.smtpAccountId || dto.accountId || dto.id || dto.senderEmail;
      const destinationEmail = dto.testEmail || dto.to || dto.email;
      const mailSubject = dto.subject;
      const mailBody = dto.body || dto.html;

      if (!smtpId || !destinationEmail) {
        throw new Error('SMTP account ID/Email and destination email are required');
      }

      if (!mailSubject || !mailBody) {
        throw new Error('Campaign subject and body are required to send a test email in the exact format.');
      }

      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(smtpId);

      const query = isValidObjectId
        ? { _id: smtpId, tenantId: workspaceId }
        : { fromEmail: smtpId, tenantId: workspaceId };

      const config = await this.smtpSenderModel.findOne(query);
      if (!config) {
        throw new NotFoundException(`SMTP configuration not found for account: ${smtpId}`);
      }

      const transporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.userName,
          pass: config.password,
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        family: 4,
        lookup: (hostname, options, callback) => {
          require('dns').lookup(hostname, { family: 4 }, callback);
        },
      } as any);
      
      const result = await transporter.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: destinationEmail,
        subject: mailSubject,
        html: mailBody,
        replyTo: config.useCustomReplyTo ? config.replyTo : config.fromEmail,
      });

      return new CustomResponse(200, 'Test email sent successfully', result);
    } catch (error) {
      throwException(new CustomError(error.status || 500, error.message));
    }
  }

  private replaceVariables(template: string, contact: any): string {
    if (!template) return '';
    let result = template;
    
    for (const [key, value] of Object.entries(contact)) {
      const val = value?.toString() || '';

      result = result.replace(new RegExp(`{{${key}}}`, 'gi'), val);
      
      const normalizedKey = key.replace(/\s+/g, '');
      result = result.replace(new RegExp(`{{${normalizedKey}}}`, 'gi'), val);
 
      const spacedKey = key.replace(/([A-Z])/g, ' $1').trim();
      result = result.replace(new RegExp(`{{${spacedKey}}}`, 'gi'), val);
    }
    
    if (contact.email) result = result.replace(/{{email}}/gi, contact.email);
    if (contact.firstName) result = result.replace(/{{firstName}}/gi, contact.firstName);
    if (contact.name) result = result.replace(/{{name}}/gi, contact.name);

    return result;
  }

  async startCampaign(id: string, smtpAccountId: string | string[], workspaceId: string, delayMinutes: number = 0, scheduledAt?: string) {
    console.log(` Attempting to start campaign: ${id} | SMTP Account(s): ${JSON.stringify(smtpAccountId)} | Workspace: ${workspaceId}`);
    try {
      const campaign = await this.campaignModel.findOneAndUpdate(
        { _id: id, workspaceId },
        { scheduledAt: scheduledAt ? new Date(scheduledAt) : null, status: scheduledAt ? 'SCHEDULED' : 'SENDING' },
        { returnDocument: 'after' }
      );

      if (!campaign) {
        console.error(`Campaign NOT found: ${id} for workspace: ${workspaceId}`);
        throw new NotFoundException('Campaign not found. Please verify the campaign exists in your workspace.');
      }
      let finalDelayMinutes = delayMinutes;
      if (!finalDelayMinutes || finalDelayMinutes === 0) {
        console.log(` No manual delay provided. Searching for saved schedule for userId: ${campaign.userId}...`);
        const savedSchedule = await this.scheduleModel.findOne({ userId: campaign.userId }).sort({ createdAt: -1 });
        if (savedSchedule) {
          finalDelayMinutes = savedSchedule.intervalMinutes;
          console.log(`Found schedule! Using interval: ${finalDelayMinutes} minutes.`);
        } else {
          console.log(`No schedule found. Using default minor delay.`);
          finalDelayMinutes = 0.05; 
        }
      }

      campaign.delayMinutes = finalDelayMinutes;
      await campaign.save();

      const redisClient = (this.campaignQueue as any).client;
      let useQueue = true;

      if (!redisClient || redisClient.status !== 'ready') {
        console.warn(`⚠️ Redis is NOT ready (status: ${redisClient?.status || 'disconnected'}). Falling back to Sync Mode.`);
        useQueue = false;
      }

      console.log(`✅ Campaign found: ${campaign.name}. Validating SMTP accounts...`);

      let targetSmtpIds: string[] = [];
      if (!smtpAccountId || smtpAccountId === 'all' || (Array.isArray(smtpAccountId) && smtpAccountId.length === 0)) {
        console.log(`No SMTP accounts specified. Fetching all available accounts for workspace: ${workspaceId}`);
        const allConfigs = await this.smtpSenderModel.find({ tenantId: workspaceId });
        targetSmtpIds = allConfigs.map(c => (c as any)._id.toString());
      } else {
        targetSmtpIds = Array.isArray(smtpAccountId) ? smtpAccountId : [smtpAccountId];
      }

      const smtpConfigs = await this.smtpSenderModel.find({ _id: { $in: targetSmtpIds }, tenantId: workspaceId });
      
      if (!smtpConfigs || smtpConfigs.length === 0) {
        console.error(`❌ No valid SMTP configurations found for IDs: ${targetSmtpIds} in workspace: ${workspaceId}`);
        throw new NotFoundException(`No valid SMTP configurations found. Please ensure you have at least one SMTP account added.`);
      }

      console.log(`✅ Found ${smtpConfigs.length} SMTP Config(s). Preparing...`);

      let delayMs = 0;
      if (scheduledAt) {
        const scheduledTime = new Date(scheduledAt).getTime();
        if (isNaN(scheduledTime)) {
          throw new Error('Invalid scheduledAt date format.');
        }
        delayMs = Math.max(0, scheduledTime - Date.now());
      }

      const jobData = {
        campaignId: id,
        smtpAccountIds: targetSmtpIds,
        workspaceId,
      };

      if (useQueue) {
        console.log(`🚀 Adding job to Redis queue with delay: ${delayMs}ms`);
        try {
          await this.campaignQueue.add('process-campaign', jobData, {
            delay: delayMs,
            removeOnComplete: true,
          });
          console.log(`🎉 Job added successfully to campaign queue.`);
        } catch (queueError) {
          console.error('🔥 Failed to add job to Bull queue:', queueError.message);
          console.log(`🔄 Redis Error. Falling back to setTimeout mode (Delay: ${delayMs}ms).`);
          setTimeout(() => {
            this.runCampaignJob(jobData).catch(err => console.error('Error in fallback job:', err));
          }, delayMs);
        }
      } else {
        console.log(`⚡ Redis offline. Respecting schedule via setTimeout (Delay: ${delayMs}ms).`);
        // Run in the background using setTimeout to respect the delay
        setTimeout(() => {
          this.runCampaignJob(jobData).catch(err => console.error('Error in sync-mode job:', err));
        }, delayMs);
      }

      const message = 'email sent successfully';

      return new CustomResponse(200, message);
    } catch (error) {
      console.error(`🔥 Error in startCampaign:`, error.message);
      if (error instanceof NotFoundException || error.status) {
        throw error;
      }
      throwException(new CustomError(500, error.message));
    }
  }

  // This will be moved to a processor, but for now I'll keep it here and call it from a processor soon
  async runCampaignJob(data: any) {
    console.log(`🛠️ Processor running job for campaign: ${data.campaignId}`);
    const { campaignId, smtpAccountIds, workspaceId } = data;
    const campaign = await this.campaignModel.findOne({ _id: campaignId, workspaceId });
    if (!campaign) {
      console.error(`❌ Job Failed: Campaign ${campaignId} not found during processing.`);
      return;
    }

    // Fetch fresh config from DB to ensure we have the latest password/settings
    const smtpConfigs = await this.smtpSenderModel.find({ _id: { $in: smtpAccountIds }, tenantId: workspaceId }).lean();
    if (!smtpConfigs || smtpConfigs.length === 0) {
      console.error(`❌ Job Failed: No SMTP configs found for ${smtpAccountIds} during processing.`);
      return;
    }

    const transporters = smtpConfigs.map(config => {
      return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpPort === 465,
        auth: {
          user: config.userName ? config.userName.trim() : '',
          pass: config.password ? config.password.trim() : '',
        },
        tls: {
          rejectUnauthorized: false,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        family: 4,
        lookup: (hostname, options, callback) => {
          require('dns').lookup(hostname, { family: 4 }, callback);
        },
      } as any);
    });

    await this.processCampaignSending(campaign, smtpConfigs, transporters, workspaceId);
  }

  private async processCampaignSending(campaign: any, smtpConfigs: any[], transporters: any[], workspaceId: string) {
    console.log(`🚀 Starting Bulk Send for Campaign: ${campaign.name} (${campaign.contacts.length} contacts) using ${smtpConfigs.length} SMTP accounts`);

    let currentSmtpIndex = 0;
    for (const contact of campaign.contacts) {
      try {
        const recipientEmail = contact.email ? contact.email.toString().trim() : '';

        // ✅ VALIDATION: Ensure the email is valid and contains an '@'
        if (!recipientEmail || !recipientEmail.includes('@')) {
          console.error(`⚠️ Skipping Contact: "${recipientEmail}" is not a valid email. Please check your CSV mapping.`);
          continue;
        }

        const smtpConfig = smtpConfigs[currentSmtpIndex % smtpConfigs.length];
        const transporter = transporters[currentSmtpIndex % transporters.length];

        const personalizedSubject = this.replaceVariables(campaign.subject, contact);
        const personalizedBody = this.replaceVariables(campaign.body, contact);

        await this.mailService.sendEmailWithTracking(
          transporter,
          smtpConfig.userName,
          recipientEmail,
          personalizedSubject,
          personalizedBody,
          workspaceId
        );

        console.log(`✅ [SMTP: ${smtpConfig.fromEmail}] Sent successfully to: ${recipientEmail}`);

        currentSmtpIndex++;
      } catch (error) {
        let errorMessage = error.message;
        if (errorMessage.includes('535-5.7.8') || errorMessage.includes('BadCredentials')) {
          errorMessage = 'Gmail SMTP Error: Username and Password not accepted. FIX: You MUST use a Google "App Password".';
        }
        console.error(`❌ Failed sending to ${contact.email}:`, errorMessage);
      }

      // Always wait the specified interval, even on failure
      const delayMs = (campaign.delayMinutes || 0.05) * 60 * 1000;
      if (delayMs > 0) {
        console.log(`Waiting ${delayMs}ms before next email...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`🏁 Finished Bulk Send for Campaign: ${campaign.name}`);
  }
}