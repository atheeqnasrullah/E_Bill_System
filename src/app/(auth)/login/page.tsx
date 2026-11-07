import AuthForm from '../AuthForm';
import { signIn } from '../actions';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return <AuthForm mode="login" action={signIn} />;
}
