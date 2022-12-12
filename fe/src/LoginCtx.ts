import {getCookie, removeCookie, setCookie} from "./utils";
import {COOKIE_LOGIN_USER} from "./constants";

export default class LoginCtx {
  curUser: { id, email }

  _showLogin: boolean

  //loginRef: Function

  constructor(user) {
    this.curUser = user
  }

  showLogin() {
    this._showLogin = true
  }

  hideLogin() {
    this._showLogin = false
  }

  login(user) {
    this.hideLogin()
    this.curUser = user
    //this.loginRef({user:user})

    setCookie(COOKIE_LOGIN_USER, JSON.stringify(user), 30)
    //localStorage.setItem(LS_USER, JSON.stringify(user))
  }

  logout() {
    this.curUser = void 0
    removeCookie(COOKIE_LOGIN_USER)
    //localStorage.removeItem(COOKIE_LOGIN_USER)
  }

  static init() {
    let curUser
    const user = getCookie(COOKIE_LOGIN_USER)
    if (user) {
      curUser = JSON.parse(user)
    }

    return new LoginCtx(curUser)
  }
}