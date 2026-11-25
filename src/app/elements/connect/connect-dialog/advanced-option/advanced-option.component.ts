import { HttpService, LogService, SettingService } from '@app/services';
import { resolutionsChoices } from '@app/globals';
import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { Asset, ConnectMethod, ConnectOption, GlobalSetting, Protocol, Setting } from '@app/model';

@Component({
  standalone: false,
  selector: 'elements-advanced-option',
  templateUrl: 'advanced-option.component.html',
  styleUrls: ['advanced-option.component.scss']
})
export class ElementAdvancedOptionComponent implements OnChanges, OnInit {
  @Input() asset: Asset;
  @Input() protocol: Protocol;
  @Input() connectMethod: ConnectMethod;
  @Input() connectOption: any = {};

  public isShowAdvancedOption = false;
  private boolChoices = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];

  public setting: Setting;
  public globalSetting: GlobalSetting;
  private allOptions: ConnectOption[] = [];
  public advancedOptions: ConnectOption[] = [];

  // Applet host choices for the 'applet' connect method; '' means Automatic
  public appletHostOptions: Array<{ label: string; value: string }> = [
    { label: 'Automatic', value: '' }
  ];
  private appletHostsKey = '';
  private appletHostsReqId = 0;

  constructor(
    public _settingSvc: SettingService,
    private _http: HttpService,
    private _logger: LogService
  ) {
    this.setting = _settingSvc.setting;
    this.globalSetting = _settingSvc.globalSetting;
  }

  ngOnInit() {
    this.allOptions = this.buildAllOptions();
    this.checkOptions();
  }

  buildAllOptions(): ConnectOption[] {
    const gs = this._settingSvc.globalSetting;
    const hasX = this._settingSvc.hasXPack?.() ?? false;

    return [
      {
        type: 'select',
        field: 'charset',
        label: 'Charset',
        hidden: () => {
          const protocolsCanCharset: Array<string> = ['ssh', 'telnet'];
          return (
            (this.connectMethod && this.connectMethod.component !== 'koko') ||
            !protocolsCanCharset.includes(this.protocol.name)
          );
        },
        value: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'UTF-8', value: 'utf8' },
          { label: 'GBK', value: 'gbk' },
          { label: 'GB2312', value: 'gb2312' },
          { label: 'IOS-8859-1', value: 'ios-8859-1' }
        ]
      },
      {
        type: 'select',
        field: 'disableautohash',
        hidden: () => {
          const protocolsCanAutoHash: Array<string> = ['mysql', 'mariadb'];
          if (this.connectMethod) {
            if (this.connectMethod.component === 'koko') {
              return (
                this.connectMethod.component !== 'koko' ||
                !protocolsCanAutoHash.includes(this.protocol.name)
              );
            }
            if (this.connectMethod.component === 'chen') {
              return false;
            }
          }
          return true;
        },
        label: 'Disable auto completion',
        value: false,
        options: this.boolChoices
      },
      {
        type: 'select',
        field: 'token_reusable',
        hidden: () => {
          return !(
            this.connectMethod.component === 'magnus' &&
            this.connectMethod.value === 'db_client' &&
            this.globalSetting.CONNECTION_TOKEN_REUSABLE
          );
        },
        label: 'Set reusable',
        value: false,
        options: this.boolChoices
      },
      {
        type: 'select',
        field: 'resolution',
        hidden: () => {
          const protocolsCanResolution: Array<string> = ['rdp'];
          return !protocolsCanResolution.includes(this.protocol.name);
        },
        options: resolutionsChoices.map(i => ({ label: i, value: i.toLowerCase() })),
        label: 'RDP resolution',
        value: this.setting.graphics.rdp_resolution || 'auto'
      },
      {
        type: 'select',
        field: 'backspaceAsCtrlH',
        hidden: () => {
          return this.connectMethod && this.connectMethod.component !== 'koko';
        },
        options: this.boolChoices,
        label: 'Backspace as Ctrl+H',
        value: this.setting.command_line.is_backspace_as_ctrl_h
      },
      {
        type: 'select',
        field: 'appletConnectMethod',
        options: [
          { label: 'Web', value: 'web' },
          ...(gs.TERMINAL_RAZOR_ENABLED ? [{ label: 'Client', value: 'client' }] : [])
        ],
        label: 'Applet connect method',
        value: this.setting.graphics.applet_connection_method,
        hidden: () => {
          if (!this._settingSvc.hasXPack()) {
            return true;
          }
          return !this.connectMethod || this.connectMethod.component !== 'tinker';
        }
      },
      {
        type: 'select',
        field: 'virtualappConnectMethod',
        options: [
          { label: 'Web', value: 'web' },
          ...(true ? [{ label: 'Client', value: 'client' }] : [])
        ],
        label: 'Virtualapp connect method',
        value: this.setting.graphics.applet_connection_method,
        hidden: () => {
          if (!hasX) return true;
          return !this.connectMethod || this.connectMethod.component !== 'panda';
        }
      },
      {
        type: 'select',
        field: 'applet_host',
        label: 'Applet host',
        value: '',
        options: this.appletHostOptions,
        hidden: () => !this.connectMethod || this.connectMethod.type !== 'applet'
      },
      {
        type: 'select',
        field: 'reusable',
        options: this.boolChoices,
        label: 'RDP file reusable',
        value: false,
        hidden: () => {
          if (!this.connectMethod) return true;
          if (!gs.CONNECTION_TOKEN_REUSABLE) return true;
          if (this.connectMethod.component === 'razor') return false;

          if (this.connectMethod.component === 'tinker') {
            return this.connectOption.appletConnectMethod !== 'client';
          }

          return true;
        }
      },
      {
        type: 'select',
        field: 'rdp_connection_speed',
        label: 'RDP connection speed',
        hidden: () => {
          return this.connectMethod && this.connectMethod.component !== 'razor';
        },
        value: 'auto',
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Low Speed Broadband (256 Kbps - 2 Mbps)', value: 'low_speed_broadband' },
          { label: 'High-speed broadband (2 Mbps – 10 Mbps )', value: 'high_speed_broadband' }
        ]
      }
    ];
  }

  checkOptions() {
    if (!this.protocol) {
      return;
    }

    const onlyUsingDefaultFields = ['reusable'];

    this.allOptions.forEach(i => {
      if (this.connectOption[i.field] === undefined) {
        this.connectOption[i.field] = i.value;
      }

      if (onlyUsingDefaultFields.includes(i.field)) {
        i.value = this.connectOption[i.field];
      }
    });

    this.advancedOptions = this.allOptions.filter(i => !i.hidden());
    this.isShowAdvancedOption = this.advancedOptions.length > 0;

    // If the remembered select value is no longer among the options, fall back to web or the default value
    this.advancedOptions
      .filter(i => i.type === 'select')
      .forEach(i => {
        const options = i.options || [];
        const values = new Set(options.map(opt => opt.value));
        const current = this.connectOption[i.field];

        if (!values.has(current)) {
          let fallback: any = 'web';

          if (!values.has(fallback)) {
            fallback = i.value !== undefined ? i.value : options[0] ? options[0].value : undefined;
          }
          if (fallback !== undefined) {
            this.connectOption[i.field] = fallback;
          }
        }
      });
  }

  onChange() {
    this.allOptions = this.buildAllOptions();
    this.checkOptions();
  }

  ngOnChanges() {
    const isApplet = !!this.asset && !!this.connectMethod && this.connectMethod.type === 'applet';
    const key = isApplet ? `${this.asset.id}|${this.connectMethod.value}` : '';
    if (key !== this.appletHostsKey) {
      this.appletHostsKey = key;
      this.loadAppletHosts();
    }
    // Campo oculto fora do metodo 'applet': nao enviar valor antigo em connect_options
    if (!isApplet && this.connectOption) {
      delete this.connectOption['applet_host'];
    }

    this.allOptions = this.buildAllOptions();
    this.checkOptions();
  }

  private loadAppletHosts() {
    const reqId = ++this.appletHostsReqId;
    const automatic = { label: 'Automatic', value: '' };

    if (!this.appletHostsKey) {
      this.appletHostOptions = [automatic];
      return;
    }

    const assetId = this.asset.id;
    const applet = this.connectMethod.value;
    this.appletHostOptions = [automatic];

    this._http.getAllowedAppletHosts(assetId, applet).subscribe({
      next: hosts => {
        if (reqId !== this.appletHostsReqId) return;
        const hostOptions = (hosts || []).map(h => ({ label: h.name, value: h.id }));
        this.appletHostOptions = [automatic, ...hostOptions];
        this.refreshOptions();
      },
      error: err => {
        if (reqId !== this.appletHostsReqId) return;
        this._logger.error('Load allowed applet hosts error: ', err);
        this.appletHostOptions = [automatic];
        this.refreshOptions();
      }
    });
  }

  // Rebuild options so the select picks up new choices; checkOptions resets a stale applet_host to ''
  private refreshOptions() {
    this.allOptions = this.buildAllOptions();
    this.checkOptions();
  }
}
