import { AuthModel } from '../../data/api';
import { LoginPresenter } from './login-presenter';

export default class LoginPage {
  async render() {
    return `
      <section class="auth-container">
        <div class="auth-tabs">
          <button class="tab-btn active" data-tab="login">Login</button>
          <button class="tab-btn" data-tab="register">Register</button>
        </div>
        <div id="login-tab" class="tab-content active">
          <h1>Login ke Akun Anda</h1>
          <form id="login-form" class="auth-form" autocomplete="on">
            <div class="form-group">
              <label for="login-email">Email <span aria-label="wajib diisi">*</span></label>
              <input id="login-email" name="email" type="email" required placeholder="Masukkan email Anda" />
            </div>
            <div class="form-group">
              <label for="login-password">Password <span aria-label="wajib diisi">*</span></label>
              <input id="login-password" name="password" type="password" required placeholder="Masukkan password Anda" />
            </div>
            <button type="submit" id="login-btn" class="auth-btn">Login</button>
          </form>
        </div>
        <div id="register-tab" class="tab-content">
          <h1>Daftar Akun Baru</h1>
          <form id="register-form" class="auth-form" autocomplete="on">
            <div class="form-group">
              <label for="register-name">Nama <span aria-label="wajib diisi">*</span></label>
              <input id="register-name" name="name" type="text" required placeholder="Masukkan nama lengkap Anda" />
            </div>
            <div class="form-group">
              <label for="register-email">Email <span aria-label="wajib diisi">*</span></label>
              <input id="register-email" name="email" type="email" required placeholder="Masukkan email Anda" />
            </div>
            <div class="form-group">
              <label for="register-password">Password <span aria-label="wajib diisi">*</span></label>
              <input id="register-password" name="password" type="password" required placeholder="Minimal 8 karakter" minlength="8" />
            </div>
            <button type="submit" id="register-btn" class="auth-btn">Daftar</button>
          </form>
        </div>
        <div id="auth-loading" style="display:none;" role="status" aria-live="polite">Loading...</div>
        <div id="auth-error" style="display:none;" role="alert" aria-live="assertive"></div>
        <div id="auth-success" style="display:none;" role="status" aria-live="polite"></div>
      </section>
    `;
  }
  async afterRender() {
    const model = new AuthModel();
    const presenter = new LoginPresenter(model, this);

    this._setupTabs();

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      await presenter.loginUser(email, password);
    });

    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      await presenter.registerUser(name, email, password);
    });
  }
  _setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        tabButtons.forEach((btn) => btn.classList.remove('active'));
        tabContents.forEach((content) => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');

        this.clearMessages();
      });
    });
  }
  clearMessages() {
    const authError = document.getElementById('auth-error');
    const authSuccess = document.getElementById('auth-success');
    const authLoading = document.getElementById('auth-loading');

    if (authError) authError.style.display = 'none';
    if (authSuccess) authSuccess.style.display = 'none';
    if (authLoading) authLoading.style.display = 'none';
  }
  showLoading() {
    document.getElementById('auth-loading').style.display = 'block';
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-success').style.display = 'none';
  }  renderLoginSuccess(result) {
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-success').style.display = 'block';
    document.getElementById('auth-success').innerText = 'Login berhasil! Selamat datang, ' + result.loginResult.name;
    document.getElementById('login-form').reset();
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('authStateChanged', { 
        detail: { authenticated: true, user: result.loginResult } 
      }));
      window.location.hash = '#/';
    }, 1500);
  }
  renderRegisterSuccess(result) {
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('auth-error').style.display = 'none';
    document.getElementById('auth-success').style.display = 'block';
    document.getElementById('auth-success').innerText = result.message || 'Registrasi berhasil!';
    document.getElementById('register-form').reset();
    setTimeout(() => {
      document.querySelector('.tab-btn[data-tab="login"]').click();
    }, 1000);
  }
  renderFailedMessage(message) {
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('auth-success').style.display = 'none';
    document.getElementById('auth-error').style.display = 'block';
    document.getElementById('auth-error').innerText = message || 'Gagal login/registrasi.';
  }
  renderLoginError(message) {
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('auth-success').style.display = 'none';
    document.getElementById('auth-error').style.display = 'block';
    document.getElementById('auth-error').innerText = message || 'Gagal login.';
  }
}
