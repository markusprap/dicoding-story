import PushNotificationManager from '../../utils/push-notification-manager';

export class AddStoryPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.pushManager = new PushNotificationManager();
  }  async submitStory({ description, photo, lat, lon }) {
    try {
      this.view.showLoading();
      const result = await this.model.addStory({ description, photo, lat, lon });
      this.view.renderSuccess();
      
      try {
        if (window.pushNotificationUI) {
          const storyData = {
            id: result?.story?.id || Date.now().toString(),
            name: result?.story?.name || 'Story Baru',
            description: description.length > 50 ? description.substring(0, 50) + '...' : description,
            author: result?.story?.user || 'Anonymous',
            createdAt: result?.story?.createdAt || new Date().toISOString()
          };
          await window.pushNotificationUI.notifyNewStory(storyData);        }
      } catch (pushError) {
      }
    } catch (error) {
      this.view.renderError(error.message);
    }
  }
}
