// frontend/src/utils/isadmin.js
export function isAdmin() {
  return localStorage.getItem("admin") === "true";
}
