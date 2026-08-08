import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable()
export class FaceService {
  private token: string;
  private monitoringTabs: string[] = [];

  private isVisible = new BehaviorSubject<boolean>(false);
  isVisible$ = this.isVisible.asObservable();

  private monitoringTabCount = new BehaviorSubject<number>(0); // BehaviorSubject for monitoring the tab count
  monitoringTabCount$ = this.monitoringTabCount.asObservable(); // Expose Observable

  openFaceMonitor() {
    this.isVisible.next(true);
  }

  constructor() {
  }


  public getToken(): string {
    if (!this.token) {
      this.token = this.randomString();
    }
    return this.token;
  }

  public addMonitoringTab(tab: string): void {
    this.monitoringTabs.push(tab);
    this.monitoringTabCount.next(this.monitoringTabs.length);
  }

  public removeMonitoringTab(tab: string): void {
    const index = this.monitoringTabs.indexOf(tab);
    if (index > -1) {
      this.monitoringTabs.splice(index, 1);
      this.monitoringTabCount.next(this.monitoringTabs.length);
    }
  }

  private randomString(): string {
    return Math.random().toString(36).substring(7);
  }

  public close() {
  }
}
