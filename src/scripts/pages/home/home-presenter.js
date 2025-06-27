export class HomePresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }
  async loadStories() {
    try {
      this.view.showLoading();
      
      const result = await this.model.getStories();
      
      const stories = Array.isArray(result)
        ? result
        : (result && result.data && Array.isArray(result.data.listStory)
            ? result.data.listStory : []);
      if (!stories || stories.length === 0) {
        this.view.renderFailedMessage('Tidak ada cerita yang ditemukan.');
        return;
      }
      this.view.renderStories(stories);
    } catch (error) {
      this.view.renderFailedMessage(error.message || 'Gagal memuat data cerita.');
    }
  }
}
