export class LoginPresenter {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async loginUser(email, password) {
    try {
      this.view.showLoading();
      const result = await this.model.login({ email, password });
      this.view.renderLoginSuccess(result);
    } catch (error) {
      this.view.renderFailedMessage(error.message);
    }
  }

  async registerUser(name, email, password) {
    try {
      this.view.showLoading();
      const result = await this.model.register({ name, email, password });
      this.view.renderRegisterSuccess(result);
    } catch (error) {
      this.view.renderFailedMessage(error.message);
    }
  }
}
