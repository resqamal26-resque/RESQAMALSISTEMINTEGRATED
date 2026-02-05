import { User } from '../types';

class GoogleSheetService {
  private getAppScriptUrl(): string {
    return localStorage.getItem('resq_gas_url') || '';
  }

  async testConnection(): Promise<{ status: string; structure?: any; message?: string }> {
    const url = this.getAppScriptUrl();
    if (!url) return { status: 'error', message: 'URL tidak ditetapkan.' };

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'test_connection'
        })
      });
      return await response.json();
    } catch (err) {
      console.error("Connection Test Error:", err);
      return { status: 'error', message: 'Gagal menghubungi Web App.' };
    }
  }

  async registerUser(user: User): Promise<string> {
    const url = this.getAppScriptUrl();
    if (!url) return '';

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          data: user
        })
      });
      const result = await response.json();
      return result.spreadsheetId || '';
    } catch (err) {
      console.error("Sheet Registration Error:", err);
      return '';
    }
  }

  async syncData(spreadsheetId: string, items: { type: string, payload: any }[]): Promise<boolean> {
    const url = this.getAppScriptUrl();
    if (!url || !spreadsheetId) return false;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'sync',
          spreadsheetId,
          data: items
        })
      });
      const result = await response.json();
      return result.status === 'success';
    } catch (err) {
      console.error("Sheet Sync Error:", err);
      return false;
    }
  }
}

export const googleSheetService = new GoogleSheetService();