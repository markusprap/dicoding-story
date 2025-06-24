export class StoryDetailPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async loadStoryDetail(id) {
    try {
      this.view.showLoading();
      const story = await this.model.getStoryDetail(id);
      
      if (!story) {
        this.view.renderFailedMessage('Data cerita tidak ditemukan.');
        return;
      }
      
      this.view.renderStoryDetail(story);
    } catch (error) {
      if (error.message.includes('No authentication token')) {
        this.view.renderFailedMessage('Sesi berakhir. Silakan login kembali.');
      } else if (error.message.includes('Session expired')) {
        this.view.renderFailedMessage('Sesi berakhir. Silakan login kembali.');
      } else if (error.message.includes('404') || error.message.includes('not found')) {
        this.view.renderFailedMessage('Cerita tidak ditemukan.');
      } else {
        this.view.renderFailedMessage('Gagal memuat detail cerita.');
      }
    }
  }
}
