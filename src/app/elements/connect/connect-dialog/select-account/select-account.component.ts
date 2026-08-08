import { User } from '@app/globals';
import { FormControl } from '@angular/forms';
import { AppService, I18nService, SettingService } from '@app/services';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { Account, AccountGroup, Asset, AuthInfo, Protocol } from '@app/model';

import {
  Input,
  OnInit,
  Output,
  OnDestroy,
  Component,
  ViewChild,
  ElementRef,
  EventEmitter,
  ChangeDetectorRef
} from '@angular/core';

@Component({
  standalone: false,
  selector: 'elements-select-account',
  templateUrl: 'select-account.component.html',
  styleUrls: ['select-account.component.scss']
})
export class ElementSelectAccountComponent implements OnInit, OnDestroy {
  @Input() asset: Asset;
  @Input() accounts: Account[];
  @Input() onSubmit: BehaviorSubject<boolean>;
  @Input() onSubmit$: BehaviorSubject<boolean>;
  @Input() manualAuthInfo: AuthInfo;
  @Input() protocol: Protocol;
  @Input() preSelectedAccount: Account; // Receives the preselected account passed in from the parent component
  @Output() accountSelectedChange: EventEmitter<Account> = new EventEmitter<Account>();
  @Output() manualUsernameChanged: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild('username', { static: false }) usernameRef: ElementRef;
  @ViewChild('password', { static: false }) passwordRef: ElementRef;
  @ViewChild('sshKeyFileInput', { static: false }) sshKeyFileInputRef: ElementRef<HTMLInputElement>;

  public hidePassword = true;
  public rememberAuthDisabled = null;
  public passwordSecret = '';
  public sshKeySecret = '';
  usernameControl = new FormControl();
  localAuthItems: AuthInfo[];
  filteredOptions: AuthInfo[];
  accountManualAuthInit = false;
  usernamePlaceholder: string = '';
  public accountSelected: Account; // Internal state
  public groupedAccounts: AccountGroup[];
  public accountCtl: FormControl = new FormControl();
  public accountFilterCtl: FormControl = new FormControl();
  public filteredUsersGroups: ReplaySubject<AccountGroup[]> = new ReplaySubject<AccountGroup[]>(1);
  protected _onDestroy = new Subject<void>();
  private userManuallySelected = false; // Flags whether the user manually selected an account

  constructor(
    private _settingSvc: SettingService,
    private _appSvc: AppService,
    private _i18n: I18nService,
    private _cdRef: ChangeDetectorRef
  ) {
    this.usernamePlaceholder = this._i18n.instant('Username');
    this.rememberAuthDisabled = !this._settingSvc.globalSetting.SECURITY_LUNA_REMEMBER_AUTH;
  }

  get noSecretAccounts() {
    return this.accounts
      .filter(item => !item.has_secret)
      .filter(item => item.username !== '@ANON')
      .sort((a, b) => {
        const eq = +a.username.startsWith('@') - +b.username.startsWith('@');
        if (eq !== 0) {
          return eq;
        }
        if (a.name === 'root') {
          return -1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  get hasSecretAccounts() {
    return this.accounts
      .filter(item => item.has_secret)
      .sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
  }

  get anonymousAccounts() {
    const allowAnonymousCategory = ['custom', 'web'];
    return this.accounts.filter(item => {
      return (
        item.username === '@ANON' && allowAnonymousCategory.indexOf(this.asset.category.value) >= 0
      );
    });
  }

  get adDomain() {
    if (!this.protocol || this.protocol.name !== 'rdp') {
      return '';
    }
    const rdp = this.asset.permed_protocols.find(item => item.name === 'rdp');
    if (!rdp || !rdp.setting || typeof rdp.setting !== 'object') {
      return '';
    }
    return rdp.setting['ad_domain'];
  }

  get showManualUsernameInput() {
    if (!this.accountSelected) {
      return false;
    }
    return this.accountSelected.username === '@INPUT' || this.accountSelected.username === '@USER';
  }

  get secretType(): 'password' | 'ssh_key' {
    return this.manualAuthInfo?.['input_secret_type'] || 'password';
  }

  set secretType(value: 'password' | 'ssh_key') {
    this.manualAuthInfo['input_secret_type'] = value;
  }

  public compareFn = (f1: Account, f2: Account) => {
    if (!f1 || !f2) return false;
    return f1.alias === f2.alias && f1.id === f2.id;
  };

  ngOnInit() {
    // Reset the user-manually-selected flag
    this.userManuallySelected = false;

    // If the parent component passed in a preselected account, use it
    if (this.preSelectedAccount) {
      this.accountSelected = this.preSelectedAccount;
    }

    // Check the URL parameter first, it has the highest priority
    this.checkUrlForLoginAccountParam();

    // Then group accounts (if the URL doesn't specify an account, a default one will be set)
    this.groupedAccounts = this.groupAccounts();
    this.filteredUsersGroups.next(this.groupedAccounts.slice());

    // Make sure the account object reference is consistent
    this.ensureAccountReference();

    if (this.accountSelected) {
      const username = this.accountSelected.username;
      this.manualAuthInfo.username = username.startsWith('@') ? '' : username;
      if (username === '@USER') {
        this.manualAuthInfo.username = User.username;
      }
      this.accountSelectedChange.emit(this.accountSelected);
      this.onAccountChanged();
    }
    this.syncSecretsFromManualAuth();
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  handleAccountChanged(newAccount?: Account) {
    // If a new account was passed in, use it; otherwise use the current account
    const selectedAccount = newAccount || this.accountSelected;

    this.accountSelected = selectedAccount;
    this.userManuallySelected = true;

    this.accountSelectedChange.emit(this.accountSelected);

    this.onAccountChanged();
  }

  getPreAccountSelected() {
    const preConnectData = this._appSvc.getPreConnectData(this.asset);
    if (preConnectData && preConnectData.account) {
      return this.accounts.find(item => item.alias === preConnectData.account.alias);
    }
  }

  getAccountUsername(account: Account) {
    if (account.username.includes('@')) {
      return account.username;
    }
    if (this.adDomain) {
      return `${account.username}@${this.adDomain}`;
    }
    return account.username;
  }

  getAccountDisplay(account: Account) {
    const username = this.getAccountUsername(account);
    if (username.startsWith('@')) {
      return account.name;
    } else if (account.name === username) {
      return account.name;
    } else {
      return `${account.name}(${username})`;
    }
  }

  groupAccounts() {
    let groups = [];
    const preAccountSelected = this.getPreAccountSelected();

    if (preAccountSelected) {
      groups.push({
        name: this._i18n.instant('Last login'),
        accounts: [preAccountSelected]
      });
    }

    groups.push({
      name: this._i18n.instant('With secret accounts'),
      accounts: this.hasSecretAccounts
    });
    groups.push({
      name: this._i18n.instant('Manual accounts'),
      accounts: this.noSecretAccounts
    });
    groups.push({
      name: this._i18n.instant('Special accounts'),
      accounts: this.anonymousAccounts
    });

    groups = groups.filter(group => group.accounts.length > 0);

    // Priority:
    // 1. If the user has already manually selected an account, leave it unchanged
    // 2. If there's already a selected account but not user-selected, it can be overridden
    // 3. If the parent component passed in a preselected account, use it
    // 4. Otherwise use the first available account as the default
    if (this.userManuallySelected && this.accountSelected) {
      // User manually selected account, leave it unchanged
    } else if (!this.accountSelected) {
      if (this.preSelectedAccount) {
        // Use the preselected account passed in from the parent component
        this.accountSelected = this.preSelectedAccount;
      } else {
        // Use the first available account as the default
        for (const group of groups) {
          if (group.accounts.length > 0) {
            this.accountSelected = group.accounts[0];
            break;
          }
        }
      }
    }

    if (groups.length === 0) {
      groups.push({
        name: this._i18n.instant('No account available'),
        accounts: []
      });
    }

    return groups;
  }

  checkUrlForLoginAccountParam() {
    const loginAccount = this._appSvc.getQueryString('login_account');
    const accounts: Array<any> = this.accounts || [];
    if (loginAccount && accounts.length > 0) {
      for (const i of accounts) {
        if (loginAccount === i.id) {
          this.accountSelected = i;
          break;
        }
      }
    }
  }

  filterAccounts() {
    if (!this.groupedAccounts) {
      return;
    }
    let search = this.accountFilterCtl.value;
    const accountsGroupsCopy = this.copyGroupedAccounts(this.groupedAccounts);

    if (!search) {
      this.filteredUsersGroups.next(this.groupedAccounts.slice());
      return;
    }
    search = search.toLowerCase();
    const filteredGroups = accountsGroupsCopy.filter(group => {
      const showGroup = group.name.toLowerCase().indexOf(search) > -1;
      if (!showGroup) {
        group.accounts = group.accounts.filter(account => {
          return account.name.toLowerCase().indexOf(search) > -1;
        });
      }
      return group.accounts.length > 0;
    });
    this.filteredUsersGroups.next(filteredGroups);
  }

  setUsernamePlaceholder() {
    if (this.accountSelected.username === 'rdp') {
      this.usernamePlaceholder = this._i18n.instant('Username@Domain');
    } else {
      this.usernamePlaceholder = this._i18n.instant('Username');
    }
  }

  onAccountChanged() {
    if (!this.accountSelected) {
      return;
    }
    if (this.accountSelected.has_secret) {
      return;
    }
    if (this.accountSelected.username === '@INPUT') {
      this.manualAuthInfo.username = '';
    } else if (this.accountSelected.username === '@USER') {
      this.manualAuthInfo.username = User.username;
    } else {
      this.manualAuthInfo.username = this.accountSelected.username;
    }
    this.manualAuthInfo.secret = '';
    this.passwordSecret = '';
    this.sshKeySecret = '';
    // When switching accounts, reset to the default type first, then let the local cache merge override it (avoids carrying over the previous account's ssh_key)
    this.manualAuthInfo['input_secret_type'] = 'password';
    this.localAuthItems = this._appSvc.getAccountLocalAuth(this.asset.id);
    if (this.manualAuthInfo.username) {
      this.localAuthItems = this.localAuthItems.filter(
        item => item.username === this.manualAuthInfo.username
      );
    }
    if (this.localAuthItems && this.localAuthItems.length > 0) {
      this.manualAuthInfo = Object.assign(this.manualAuthInfo, this.localAuthItems[0]);
    }
    this.syncSecretsFromManualAuth();
    this.applyCurrentSecretToManualAuth();
    this.setUsernamePlaceholder();
    setTimeout(() => {
      if (this.manualAuthInfo.username && this.passwordRef) {
        this.passwordRef.nativeElement.focus();
      } else if (this.usernameRef) {
        this.usernameRef.nativeElement.focus();
      }
    }, 10);

    this._cdRef.detectChanges();
  }

  onSecretTypeChange(_type: 'password' | 'ssh_key') {
    this.applyCurrentSecretToManualAuth();
  }

  onPasswordSecretChange(secret: string) {
    this.passwordSecret = secret;
    if (this.secretType === 'password') {
      this.manualAuthInfo.secret = secret;
    }
  }

  onSshKeySecretChange(secret: string) {
    this.sshKeySecret = secret;
    if (this.secretType === 'ssh_key') {
      this.manualAuthInfo.secret = secret;
    }
  }

  selectSshKeyFile() {
    this.sshKeyFileInputRef?.nativeElement?.click();
  }

  onSshKeyFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target?.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      this.sshKeySecret = content;
      if (this.secretType === 'ssh_key') {
        this.manualAuthInfo.secret = content;
      }
      this._cdRef.detectChanges();
    };
    reader.onerror = () => {
      console.error('Load SSH key file failed');
    };
    reader.readAsText(file);
    target.value = '';
  }

  private syncSecretsFromManualAuth() {
    const secret = this.manualAuthInfo?.secret || '';
    const secretType = this.manualAuthInfo?.['input_secret_type'] || 'password';
    if (secretType === 'ssh_key') {
      this.sshKeySecret = secret;
      this.passwordSecret = '';
    } else {
      this.passwordSecret = secret;
      this.sshKeySecret = '';
    }
  }

  private applyCurrentSecretToManualAuth() {
    this.manualAuthInfo.secret =
      this.secretType === 'ssh_key' ? this.sshKeySecret : this.passwordSecret;
  }

  onFocus() {
    if (!this.accountManualAuthInit) {
      this.usernameControl.setValue('');
      this.accountManualAuthInit = true;
    }
  }

  onUsernameChanges() {
    const filterValue = this.manualAuthInfo.username.toLowerCase();
    this.filteredOptions = this.localAuthItems.filter(authInfo => {
      if (authInfo.username.toLowerCase() === filterValue) {
        this.manualAuthInfo = Object.assign(this.manualAuthInfo, authInfo);
        this.syncSecretsFromManualAuth();
        this.applyCurrentSecretToManualAuth();
      }
      return authInfo.username.toLowerCase().includes(filterValue);
    });
    this.manualUsernameChanged.emit(this.manualAuthInfo.username);
  }

  getSavedAuthInfos() {
    this.localAuthItems = this._appSvc.getAccountLocalAuth(this.asset.id);
  }

  protected copyGroupedAccounts(groups) {
    const accountsCopy = [];
    groups.forEach(group => {
      accountsCopy.push({
        name: group.name,
        accounts: group.accounts.slice()
      });
    });
    return accountsCopy;
  }

  private ensureAccountReference() {
    if (!this.accountSelected || !this.groupedAccounts) {
      return;
    }

    // Find the matching account object among the groups
    for (const group of this.groupedAccounts) {
      const foundAccount = group.accounts.find(
        account => account.alias === this.accountSelected.alias
      );
      if (foundAccount) {
        if (foundAccount !== this.accountSelected) {
          this.accountSelected = foundAccount;
          this.accountSelectedChange.emit(this.accountSelected);
        }
        break;
      }
    }
  }
}
