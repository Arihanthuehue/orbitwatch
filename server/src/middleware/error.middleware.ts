import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction): void {
  console.error(`[API ERROR] ${req.method} ${req.url}:`, err.message || err);

  const statusCode = err.status || err.statusCode || 500;
  
  // Custom message mapping for known MySQL error codes
  let userMessage = err.message || 'Internal server error occurred.';
  if (err.code === 'ER_DUP_ENTRY') {
    userMessage = 'Conflict: An entry with this unique key or identifier already exists.';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    userMessage = 'Referential Integrity Error: Referenced parent record does not exist.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    userMessage = 'Constraint Error: Cannot delete or update record because child rows reference it.';
  } else if (err.sqlState === '45000') {
    // Custom trigger SIGNAL
    userMessage = err.message.replace(/^Error:\s*/, '');
  }

  res.status(statusCode).json({
    success: false,
    message: userMessage,
    code: err.code || 'INTERNAL_ERROR'
  });
}
