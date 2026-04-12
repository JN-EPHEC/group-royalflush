declare namespace Express {
  interface Request {
    user?: {
      id: string;
    };
    /** Renseigné par authenticateToken (JWT) */
    userId?: number;
  }
}