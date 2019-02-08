import { Component, OnInit, ViewChild, Input, Output} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GanttEditorComponent, GanttEditorOptions } from 'ng-gantt';
import * as moment_tz from 'moment-timezone';
import * as moment from 'moment';
import 'moment-duration-format';
import * as _ from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent implements OnInit {
  @ViewChild('installGantt') installGantt: GanttEditorComponent;

  private REQUEST_TASK_STATUS = {
    'pending': 'gtaskpurple',
    'running': 'gtaskyellow',
    'completed': 'gtaskgreen',
    'succeeded': 'gtaskgreen',
    'success': 'gtaskgreen',
    'failed': 'gtaskred',
    'failure': 'gtaskred',
    'error': 'gtaskpink'
  };

  public tasks: any[];
  private depth = 5;
  public ganttOptions: GanttEditorOptions = {
    vCaptionType: 'Caption',
    vShowRes: 0,
    vShowDur: 0,
    vShowComp: 0,
    vShowStartDate: 0,
    vShowEndDate: 0,
    vHourColWidth: 60,
    vFormatArr: ['Hour'],
    vFormat: 'hour',
    vDateTaskDisplayFormat: 'HH:MI mm/dd/yyyy',
    vShowTaskInfoLink: 1,
    vShowDeps: 0
  };
  constructor(private http: HttpClient) {
    this.getJSON().subscribe(data => {
     // this.tasks = this.jsonToGantt(data, 0, 0);
    });
  }

  public reloadData(jsonData) {
    console.log('reload');
    this.installGantt.setOptions(this.ganttOptions);
    this.tasks = this.jsonToGantt(JSON.parse(jsonData), 0, 0);
    console.log(this.tasks);
  }

  public getJSON(): Observable<any> {
    return this.http.get('assets/data.json');
  }


  private jsonToGantt(data, parent, level): any[] {
    let ganttData: any[] = [];
    let id, name, status, startTime, endTime: string;
    let isGroup = 0;
    const children = [];
    if (Array.isArray(data)) {
      for (const elem of data) {
        children.push(elem);
      }
    } else {
      for (const key of Object.keys(data)) {
        if (key === null || data[key] === null) {
          continue;
        } else if ( ['tasks', 'steps'].includes(key.toLowerCase()) && Array.isArray(data[key])) {
          isGroup = 1;
          children.push(data[key]);
        } else if (typeof data[key] === 'object') {
          if (data[key].tasks) {
            isGroup = 1;
            children.push(data[key].tasks);
          } else if (data[key].steps) {
            isGroup = 1;
            children.push(data[key].steps);
          }
        } else if (key.includes('name')) {
          name = data[key];
        } else if (key.toLowerCase() === 'id') {
          id = data[key];
        } else if (key.toLowerCase() === 'status') {
          status = data[key].toLowerCase();
        } else if (key.match(/(start|begin)\-?(date|time)/i)) {
          startTime = this.parseHqTime(data[key]);
        } else if (key.match(/(end|finish)\-?(date|time)/i)) {
          endTime = this.parseHqTime(data[key]);
        }
      }
      if ((name || id) && status && startTime && endTime) {
        id = (parent !== 0 ? parent + '-' : '') + (id || name);
        const task = {
          'pID': id,
          'pName': name || id,
          'pStart': startTime,
          'pEnd': endTime,
          'pStatus': status,
          'pClass': this.REQUEST_TASK_STATUS[status],
          'pMile': 0,
          'pRes': '',
          'pGroup': level >= this.depth ? 0 : isGroup,
          'pParent': parent,
          'pOpen': 0,
          'pCaption': ''
        };
        ganttData.push(task);
      }
    }
    if (level <= this.depth) {
      for (const child of children) {
        ganttData = ganttData.concat(this.jsonToGantt(child, id || parent, level + 1));
      }
    }

    return ganttData;
  }

  private parseHqTime(rawTime: string): string {
    if (rawTime) {
      return moment_tz.tz(rawTime, 'America/Los_Angeles').format('YYYY-MM-DD HH:mm');
    } else {
      return moment_tz.tz(new Date(), 'America/Los_Angeles').format('YYYY-MM-DD HH:mm');
    }
  }

  ngOnInit() {
    // this.reloadData();
  }
}
