import { AppText, Screen } from '@/components';
import { APP_NAME, env } from '@/config';

export default function AppHomeScreen() {
  return (
    <Screen>
      <AppText variant="title">{APP_NAME}</AppText>
      <AppText muted>Foundation is ready. Environment: {env.appEnv}</AppText>
    </Screen>
  );
}
