import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { EmailLog, EmailLogDocument } from '../logs/schemas/email-log.schema';
import { SmtpSender, SmtpSenderDocument } from '../smtp-sender/entities/smtp-sender.entity';
import { GoogleMail, GoogleMailDocument } from '../google-mail/entities/google-mail.entity';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import CustomResponse from 'src/provider/custom-response.service';
import { throwException } from 'src/util/util/errorhandling';
import CustomError from 'src/provider/customer-error.service';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectModel(EmailLog.name) private emailLogModel: Model<EmailLogDocument>,
    @InjectModel(SmtpSender.name) private smtpSenderModel: Model<SmtpSenderDocument>,
    @InjectModel(GoogleMail.name) private googleMailModel: Model<GoogleMailDocument>,
    private configService: ConfigService,
  ) {}

  async listAllAccounts(companyId: string) {
    this.logger.log(`🔍 DEBUG: Fetching accounts for companyId: "${companyId}"`);
    try {
      const smtpAccounts = await this.smtpSenderModel.find({ tenantId: companyId }).lean();
      const googleAccounts = await this.googleMailModel.find({ tenantId: companyId }).lean();

      this.logger.log(`📊 DEBUG: Found ${smtpAccounts.length} SMTP and ${googleAccounts.length} Google accounts in DB`);

      const allAccounts = [
        ...smtpAccounts.map(acc => ({ 
          id: acc._id, 
          email: acc.fromEmail, 
          type: 'SMTP', 
          name: acc.fromName,
          connectedAt: (acc as any).createdAt 
        })),
        ...googleAccounts.map(acc => ({ 
          id: acc._id, 
          email: acc.email, 
          type: 'GOOGLE', 
          name: acc.name,
          connectedAt: (acc as any).createdAt
        })),
      ];

      return new CustomResponse(200, 'Accounts fetched', allAccounts);
    } catch (error) {
      throwException(new CustomError(500, error.message));
    }
  }

  async getSentMails(accountId: string, companyId: string, page: number, limit: number) {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new BadRequestException('Invalid Account ID format');
    }

    try {
      let email = '';
      const smtpAcc = await this.smtpSenderModel.findOne({ _id: accountId, tenantId: companyId });
      if (smtpAcc) {
        email = smtpAcc.fromEmail;
      } else {
        const googleAcc = await this.googleMailModel.findOne({ _id: accountId, tenantId: companyId });
        if (googleAcc) {
          email = googleAcc.email;
        }
      }

      if (!email) throw new NotFoundException('Account not found');

      const skip = (page - 1) * limit;
      const logs = await this.emailLogModel
        .find({ smtpEmail: email, companyId: companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await this.emailLogModel.countDocuments({ smtpEmail: email, companyId: companyId });

      return new CustomResponse(200, 'Sent mails fetched', { logs, total, page, limit });
    } catch (error) {
      throwException(new CustomError(error.status || 500, error.message));
    }
  }

  async getReplies(accountId: string, companyId: string, messageId: string) {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new BadRequestException('Invalid Account ID format');
    }

    const smtpAcc = await this.smtpSenderModel.findOne({ _id: accountId, tenantId: companyId });
    if (smtpAcc) {
      return this.getSmtpReplies(smtpAcc, messageId);
    }

    const googleAcc = await this.googleMailModel.findOne({ _id: accountId, tenantId: companyId });
    if (googleAcc) {
      return this.getGoogleReplies(googleAcc, messageId);
    }

    throw new NotFoundException('Account not found');
  }

  async getAllRecentReplies(accountId: string, companyId: string) {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      throw new BadRequestException('Invalid Account ID format');
    }

    const smtpAcc = await this.smtpSenderModel.findOne({ _id: accountId, tenantId: companyId });
    if (smtpAcc) {
      return this.getSmtpReplies(smtpAcc);
    }

    const googleAcc = await this.googleMailModel.findOne({ _id: accountId, tenantId: companyId });
    if (googleAcc) {
      return this.getGoogleReplies(googleAcc);
    }

    throw new NotFoundException('Account not found');
  }

  private async getSmtpReplies(account: SmtpSenderDocument, targetMessageId?: string) {
    const client = new ImapFlow({
      host: account.smtpHost.replace('smtp.', 'imap.'),
      port: 993,
      secure: true,
      auth: {
        user: account.userName,
        pass: account.password,
      },
      logger: false,
    });

    try {
      await client.connect();
      let lock = await client.getMailboxLock('INBOX');
      const replies: any[] = [];

      try {
        for await (let msg of client.fetch('1:*', { envelope: true, source: true }, { changedSince: 0n })) {
           if (!msg.source) continue;
           const parsed: any = await simpleParser(msg.source);
           const inReplyTo = parsed.inReplyTo;
           const references = Array.isArray(parsed.references) ? parsed.references : [parsed.references];

           if (targetMessageId) {
             if (inReplyTo === targetMessageId || (references && (references as string[]).includes(targetMessageId))) {
               replies.push({
                 subject: parsed.subject,
                 from: parsed.from?.text,
                 date: parsed.date,
                 text: parsed.text,
                 html: parsed.html,
                 messageId: parsed.messageId,
               });
             }
           } else {
             replies.push({
                subject: parsed.subject,
                from: parsed.from?.text,
                date: parsed.date,
                text: parsed.text,
                messageId: parsed.messageId,
                inReplyTo: inReplyTo
             });
           }
           
           if (replies.length >= 50) break;
        }
      } finally {
        lock.release();
      }

      await client.logout();
      return new CustomResponse(200, 'Replies fetched', replies);
    } catch (error) {
      this.logger.error(`IMAP Error: ${error.message}`);
      return new CustomResponse(500, `Could not connect to IMAP: ${error.message}`, []);
    }
  }

  private async getGoogleReplies(account: GoogleMailDocument, targetMessageId?: string) {
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET')
    );
    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      const query = targetMessageId ? `rfc822msgid:${targetMessageId}` : 'is:unread';
      
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 20,
      });

      const messages = res.data.messages || [];
      const detailedMessages = await Promise.all(
        messages.map(async (m) => {
          if (!m.id) return null;
          const detail: any = await gmail.users.messages.get({ userId: 'me', id: m.id });
          const payload = detail.data.payload;
          if (!payload) return null;
          const headers = (payload.headers as any[]) || [];
          
          const subject = headers.find(h => h.name === 'Subject')?.value;
          const from = headers.find(h => h.name === 'From')?.value;
          const date = headers.find(h => h.name === 'Date')?.value;
          const msgId = headers.find(h => h.name === 'Message-ID')?.value;

          return {
            id: m.id,
            threadId: m.threadId,
            subject,
            from,
            date,
            messageId: msgId,
            snippet: detail.data.snippet,
          };
        })
      );

      return new CustomResponse(200, 'Google replies fetched', detailedMessages.filter(m => m !== null));
    } catch (error) {
      this.logger.error(`Gmail API Error: ${error.message}`);
      return new CustomResponse(500, `Gmail API Error: ${error.message}`, []);
    }
  }
}
