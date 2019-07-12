import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of as observableOf } from 'rxjs/internal/observable/of';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CollectionSourceComponent } from './collection-source.component';
import { ContentSource } from '../../../core/shared/content-source.model';
import { ObjectUpdatesService } from '../../../core/data/object-updates/object-updates.service';
import { INotification, Notification } from '../../../shared/notifications/models/notification.model';
import { NotificationType } from '../../../shared/notifications/models/notification-type';
import { FieldUpdate } from '../../../core/data/object-updates/object-updates.reducer';
import { NotificationsService } from '../../../shared/notifications/notifications.service';
import { DynamicFormControlModel, DynamicFormService } from '@ng-dynamic-forms/core';
import { hasValue } from '../../../shared/empty.util';
import { FormControl, FormGroup } from '@angular/forms';
import { RouterStub } from '../../../shared/testing/router-stub';
import { GLOBAL_CONFIG } from '../../../../config';
import { By } from '@angular/platform-browser';

const infoNotification: INotification = new Notification('id', NotificationType.Info, 'info');
const warningNotification: INotification = new Notification('id', NotificationType.Warning, 'warning');
const successNotification: INotification = new Notification('id', NotificationType.Success, 'success');

const uuid = '29481ed7-ae6b-409a-8c51-34dd347a0ce4';
let date: Date;
let contentSource: ContentSource;
let fieldUpdate: FieldUpdate;
let objectUpdatesService: ObjectUpdatesService;
let notificationsService: NotificationsService;
let location: Location;
let formService: DynamicFormService;
let router: Router;

describe('CollectionSourceComponent', () => {
  let comp: CollectionSourceComponent;
  let fixture: ComponentFixture<CollectionSourceComponent>;

  beforeEach(async(() => {
    date = new Date();
    contentSource = Object.assign(new ContentSource(), {
      uuid: uuid
    });
    fieldUpdate = {
      field: contentSource,
      changeType: undefined
    };
    objectUpdatesService = jasmine.createSpyObj('objectUpdatesService',
      {
        getFieldUpdates: observableOf({
          [contentSource.uuid]: fieldUpdate
        }),
        saveAddFieldUpdate: {},
        discardFieldUpdates: {},
        reinstateFieldUpdates: observableOf(true),
        initialize: {},
        getUpdatedFields: observableOf([contentSource]),
        getLastModified: observableOf(date),
        hasUpdates: observableOf(true),
        isReinstatable: observableOf(false),
        isValidPage: observableOf(true)
      }
    );
    notificationsService = jasmine.createSpyObj('notificationsService',
      {
        info: infoNotification,
        warning: warningNotification,
        success: successNotification
      }
    );
    location = jasmine.createSpyObj('location', ['back']);
    formService = Object.assign({
      createFormGroup: (fModel: DynamicFormControlModel[]) => {
        const controls = {};
        if (hasValue(fModel)) {
          fModel.forEach((controlModel) => {
            controls[controlModel.id] = new FormControl((controlModel as any).value);
          });
          return new FormGroup(controls);
        }
        return undefined;
      }
    });
    router = Object.assign(new RouterStub(), {
      url: 'http://test-url.com/test-url'
    });

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), RouterTestingModule],
      declarations: [CollectionSourceComponent],
      providers: [
        { provide: ObjectUpdatesService, useValue: objectUpdatesService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: Location, useValue: location },
        { provide: DynamicFormService, useValue: formService },
        { provide: ActivatedRoute, useValue: { parent: { data: observableOf({ dso: { payload: {} } }) } } },
        { provide: Router, useValue: router },
        { provide: GLOBAL_CONFIG, useValue: { collection: { edit: { undoTimeout: 10 } } } as any },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CollectionSourceComponent);
    comp = fixture.componentInstance;
    comp.contentSource = contentSource;
    fixture.detectChanges();
  });

  describe('on startup', () => {
    it('ContentSource should be disabled', () => {
      expect(comp.contentSource.enabled).toBe(false);
    });

    it('the input-form should be disabled', () => {
      expect(comp.formGroup.disabled).toBe(true);
    });
  });

  describe('when selecting the checkbox', () => {
    let input;

    beforeEach(() => {
      input = fixture.debugElement.query(By.css('#externalSourceCheck')).nativeElement;
      input.click();
      fixture.detectChanges();
    });

    it('should enable ContentSource', () => {
      expect(comp.contentSource.enabled).toBe(true);
    });

    it('should send a field update', () => {
      expect(objectUpdatesService.saveAddFieldUpdate).toHaveBeenCalledWith(router.url, comp.contentSource)
    });
  });

  describe('isValid', () => {
    it('should return true when ContentSource is disabled but the form invalid', () => {
      spyOnProperty(comp.formGroup, 'valid').and.returnValue(false);
      comp.contentSource.enabled = false;
      expect(comp.isValid()).toBe(true);
    });

    it('should return false when ContentSource is enabled but the form is invalid', () => {
      spyOnProperty(comp.formGroup, 'valid').and.returnValue(false);
      comp.contentSource.enabled = true;
      expect(comp.isValid()).toBe(false);
    });

    it('should return true when ContentSource is enabled and the form is valid', () => {
      spyOnProperty(comp.formGroup, 'valid').and.returnValue(true);
      comp.contentSource.enabled = true;
      expect(comp.isValid()).toBe(true);
    });
  });
});
