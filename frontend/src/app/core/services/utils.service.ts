import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  // random generate 6 random chars
  generateId(len: number = 6) {
    let start = 3;
    return Math.random().toString(36).substring(start, len + start);
  }

}
