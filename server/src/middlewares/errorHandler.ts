import { Request, Response, NextFunction } from 'express'

export function errorHandler ( err: any, req: Request, res: Response, next: NextFunction){
    console.error(err);
   // Récupère le status ou met 500 par défaut
    const status = err.status || 500;

  // Récupère le message ou message par défaut
    const message = err.message || "Internal Server Error";

  // Envoie la réponse JSON
    res.status(status).json({
    error: message,
  });
}
