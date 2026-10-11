import { Request, Response } from 'express';
import { ImmigrationService } from '../../../services/immigration.service';
import { documentService } from '../../../services/document.service';
import { ApiResponse } from '../../../utils/response';
import { asyncHandler } from '../../../utils/asyncHandler';
import { BadRequestError } from '../../../utils/appError';
import { verifyMagicBytes } from '../../../middleware/upload';

export class ImmigrationController {
  public static submitAssessment = asyncHandler(async (req: Request, res: Response) => {
    const result = await ImmigrationService.submitAssessment(req.body, req.ip);
    ApiResponse.created(res, result, 'Immigration assessment submitted successfully');
  });

  public static listCases = asyncHandler(async (req: Request, res: Response) => {
    const { status, destinationCountry, search, page, limit, sortOrder } = req.query as any;
    const userRole = req.user!.role;
    const userId = req.user!.userId;
    const userEmail = req.user!.email;

    const result = await ImmigrationService.listCases(
      userRole,
      userId,
      userEmail,
      { status, destinationCountry, search },
      { page: page ? Number(page) : 1, limit: limit ? Number(limit) : 10, sortOrder }
    );

    ApiResponse.success(res, result.items, 'Cases retrieved successfully', 200, {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  });

  public static getCaseById = asyncHandler(async (req: Request, res: Response) => {
    const result = await ImmigrationService.getCaseById(req.params.id);
    ApiResponse.success(res, result);
  });

  public static updateCaseStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status, stage, notes } = req.body;
    const result = await ImmigrationService.updateStatus(req.params.id, status, stage, notes, req.user);
    ApiResponse.success(res, result, 'Case status updated successfully');
  });

  public static uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new BadRequestError('No document file was uploaded');

    const { documentType } = req.body;
    if (!documentType) throw new BadRequestError('documentType field is required');

    // Magic-byte safety verification
    const isValidBytes = verifyMagicBytes(file.buffer, file.mimetype);
    if (!isValidBytes) {
      throw new BadRequestError('File signature does not match its claimed MIME type');
    }

    const doc = await documentService.uploadEncryptedDocument(req.params.caseId, documentType, file);
    ApiResponse.created(res, doc, 'Document uploaded and encrypted successfully');
  });

  public static getDocumentDownload = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { buffer, fileName, mimeType } = await documentService.getDecryptedDocument(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  });

  public static submitQCReview = asyncHandler(async (req: Request, res: Response) => {
    const result = await ImmigrationService.submitQCReview(
      req.params.caseId,
      req.user!.userId,
      req.body
    );
    ApiResponse.created(res, result, 'QC Review recorded successfully');
  });

  public static addNote = asyncHandler(async (req: Request, res: Response) => {
    const result = await ImmigrationService.addNote(
      req.params.caseId,
      req.user!.userId,
      req.body.note,
      req.body.noteType
    );
    ApiResponse.created(res, result, 'Case note added successfully');
  });

  public static listNotes = asyncHandler(async (req: Request, res: Response) => {
    const result = await ImmigrationService.listNotes(req.params.caseId, req.user!.role);
    ApiResponse.success(res, result);
  });

  public static verifyDocument = asyncHandler(async (req: Request, res: Response) => {
    const { documentId } = req.params;
    const { verified } = req.body;
    
    if (typeof verified !== 'boolean') {
      throw new BadRequestError('verified field must be a boolean');
    }

    const result = await documentService.updateDocumentVerification(
      documentId,
      verified,
      req.user!.userId
    );
    ApiResponse.success(res, result, `Document ${verified ? 'verified' : 'unverified'} successfully`);
  });

  public static updateCase = asyncHandler(async (req: Request, res: Response) => {
    const result = await ImmigrationService.updateCase(req.params.id, req.body, req.user);
    ApiResponse.success(res, result, 'Case updated successfully');
  });
}
