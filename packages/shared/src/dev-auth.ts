/** Local testing only — disable in production */

export const DEV_TEST_EMAIL = "test@gmail.com";
export const DEV_TEST_PASSWORD = "Test1234!";
export const DEV_TEST_CLERK_ID = "dev_auxano_test_user";
export const DEV_TEST_NAME = "Test User";
export const DEV_TEST_USERNAME = "testuser";

export function isDevTestCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEV_TEST_EMAIL &&
    password === DEV_TEST_PASSWORD
  );
}
