type AdminActionType =
  | "BLOCK_USER"
  | "UNBLOCK_USER"
  | "WITHDRAW_FUNDS"
  | "DEPOSIT_FUNDS"
  | "PROMOTE_USER";

export type AdminActionEvent = {
  actionType: AdminActionType;
  adminId: number | null;
  targetUserId: number;
  amount?: number;
  reason?: string | null;
  createdAt: string;
};

export interface AdminActionObserver {
  onAdminAction(event: AdminActionEvent): void;
}

export class AdminActionNotifier {
  private observers: AdminActionObserver[] = [];

  subscribe(observer: AdminActionObserver): void {
    this.observers.push(observer);
  }

  notify(event: AdminActionEvent): void {
    for (const observer of this.observers) {
      observer.onAdminAction(event);
    }
  }
}

class ConsoleAdminActionObserver implements AdminActionObserver {
  onAdminAction(event: AdminActionEvent): void {
    console.log("[ADMIN_ACTION]", JSON.stringify(event));
  }
}

export const adminActionNotifier = new AdminActionNotifier();
adminActionNotifier.subscribe(new ConsoleAdminActionObserver());
