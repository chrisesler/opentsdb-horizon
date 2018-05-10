import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  // random generate 6 random chars
  generateId() {
    return Math.random().toString(36).substring(3, 9);
  }

}
