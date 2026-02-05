import { User, Program, Case, Attendance, Notification } from '../types';
import { googleSheetService } from './googleSheetService';

class DatabaseService {
  private getStorage<T>(key: string): T[] {
    const data = localStorage.getItem(`resq_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(`resq_${key}`, JSON.stringify(data));
  }

  private async syncToSheet(type: string, payload: any) {
    const currentUserRaw = localStorage.getItem('resq_user');
    if (!currentUserRaw) return;
    
    const user: User = JSON.parse(currentUserRaw);
    if (user.spreadsheetId) {
      await googleSheetService.syncData(user.spreadsheetId, [{ type, payload }]);
    }
  }

  // Users
  async getUsers(state?: string): Promise<User[]> {
    const users = this.getStorage<User>('users');
    return state ? users.filter(u => u.state === state) : users;
  }

  async addUser(user: User): Promise<void> {
    const users = this.getStorage<User>('users');
    
    // Remote Sync Registration
    const spreadsheetId = await googleSheetService.registerUser(user);
    const userWithSheet = { ...user, spreadsheetId };
    
    users.push(userWithSheet);
    this.setStorage('users', users);
  }

  // Programs
  async getPrograms(state?: string): Promise<Program[]> {
    const programs = this.getStorage<Program>('programs');
    return state ? programs.filter(p => p.state === state) : programs;
  }

  async addProgram(program: Program): Promise<void> {
    const programs = this.getStorage<Program>('programs');
    programs.push(program);
    this.setStorage('programs', programs);
    
    // Simple flat payload for sheets
    this.syncToSheet('programs', {
      id: program.id,
      name: program.name,
      location: program.location,
      date: program.date,
      time: program.time,
      state: program.state,
      status: program.status
    });
  }

  async updateProgram(program: Program): Promise<void> {
    const programs = this.getStorage<Program>('programs');
    const index = programs.findIndex(p => p.id === program.id);
    if (index !== -1) {
      programs[index] = program;
      this.setStorage('programs', programs);
      this.syncToSheet('programs_updates', { 
        id: program.id, 
        status: program.status, 
        time: program.time,
        timestamp: new Date().toISOString() 
      });
    }
  }

  // Cases
  async getCases(programId?: string): Promise<Case[]> {
    const cases = this.getStorage<Case>('cases');
    return programId ? cases.filter(c => c.programId === programId) : cases;
  }

  async addCase(newCase: Case): Promise<void> {
    const cases = this.getStorage<Case>('cases');
    cases.push(newCase);
    this.setStorage('cases', cases);
    this.syncToSheet('cases', newCase);
  }

  // Attendance
  async getAttendance(programId?: string): Promise<Attendance[]> {
    const attendance = this.getStorage<Attendance>('attendance');
    return programId ? attendance.filter(a => a.programId === programId) : attendance;
  }

  async addAttendance(record: Attendance): Promise<void> {
    const attendance = this.getStorage<Attendance>('attendance');
    attendance.push(record);
    this.setStorage('attendance', attendance);
    
    // Flatten record for sheet
    this.syncToSheet('attendance', {
      ...record,
      lat: record.location.lat,
      lng: record.location.lng,
      location: undefined
    });
  }

  async updateAttendance(record: Attendance): Promise<void> {
    const attendance = this.getStorage<Attendance>('attendance');
    const index = attendance.findIndex(a => a.id === record.id);
    if (index !== -1) {
      attendance[index] = record;
      this.setStorage('attendance', attendance);
    }
  }

  // Notifications
  async getNotifications(programId?: string): Promise<Notification[]> {
    const notifications = this.getStorage<Notification>('notifications');
    return programId ? notifications.filter(n => n.programId === programId) : notifications;
  }

  async addNotification(notification: Notification): Promise<void> {
    const notifications = this.getStorage<Notification>('notifications');
    notifications.unshift(notification);
    if (notifications.length > 100) {
      notifications.pop();
    }
    this.setStorage('notifications', notifications);
  }
}

export const db = new DatabaseService();