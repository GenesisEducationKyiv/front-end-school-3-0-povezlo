import { Injectable } from '@angular/core';
import { environment } from '@environment/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly baseUrl = environment.apiUrl;

  public getUrl(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }
}
