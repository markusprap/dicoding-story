import CONFIG from '../config';

const ENDPOINTS = {
  STORIES: `${CONFIG.BASE_URL}/stories`,
};

export class StoryModel {
  constructor() {
    // Will be injected by app initialization
    this.offlineManager = null;
  }

  setOfflineManager(offlineManager) {
    this.offlineManager = offlineManager;
  }

  async getStories() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use offline manager if available
      if (this.offlineManager) {
        return await this.offlineManager.getStories();
      }
      
      // Fallback to direct API call
      const response = await fetch(ENDPOINTS.STORIES, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { authenticated: false } 
          }));
          return [];
        }
        throw new Error(`Failed to fetch stories: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (!responseData.listStory) {
        throw new Error('Invalid response format from API');
      }
        return responseData.listStory;
    } catch (error) {
      throw error;
    }
  }

  async getStory(id) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use offline manager if available
      if (this.offlineManager) {
        return await this.offlineManager.getStory(id);
      }
      
      // Fallback to direct API call
      const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch story: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return responseData.story;
    } catch (error) {
      throw error;
    }
  }
}

export class AuthModel {  async login({ email, password }) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || 'LOGIN_FAILED');
        } else {
          const text = await response.text();
          throw new Error(`Server returned non-JSON response (status ${response.status})`);
        }
      }
      
      const data = await response.json();
      
      if (data.loginResult && data.loginResult.token) {
        localStorage.setItem('token', data.loginResult.token);
        localStorage.setItem('user', JSON.stringify(data.loginResult));
      }
      
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { authenticated: true, user: data.loginResult } 
      }));      return data;
    } catch (error) {
      throw error;
    }
  }
  async register({ name, email, password }) {
    try {
      const response = await fetch(`${CONFIG.BASE_URL}/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.message || 'REGISTER_FAILED');
        } else {
          const text = await response.text();
          throw new Error(`Server returned non-JSON response (status ${response.status})`);
        }
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export class StoryDetailModel {
  async getStoryDetail(id) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const url = `${CONFIG.BASE_URL}/stories/${id}`;
      
      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { authenticated: false } 
          }));
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`Failed to get story detail: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      let story = null;
      if (responseData.story) {
        story = responseData.story;
      } else if (responseData.data) {
        story = responseData.data;
      } else if (responseData.result) {
        story = responseData.result;
      } else if (responseData.listStory && responseData.listStory.length > 0) {
        story = responseData.listStory[0];
      } else {
        if (responseData.id || responseData.name || responseData.description) {
          story = responseData;
        }
      }
      
      if (!story) {
        throw new Error('Invalid response format from API');
      }
      
      return story;
    } catch (error) {
      throw error;
    }
  }
}

export class AddStoryModel {
  async addStory({ description, photo, lat, lon }) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photo);
      if (lat && lon) {
        formData.append('lat', lat);
        formData.append('lon', lon);
      }
      
      const response = await fetch(`${CONFIG.BASE_URL}/stories`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { authenticated: false } 
          }));
          throw new Error('Session expired. Please login again.');
        }
        
        const error = await response.json();
        throw new Error(error.message || 'FAILED_TO_ADD_STORY');
      }
        return await response.json();
    } catch (error) {
      throw error;
    }
  }
}
