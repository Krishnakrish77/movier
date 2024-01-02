import AppNavigation from './navigation/appNavigation';
import { NativeWindStyleSheet } from "nativewind";

export default function App() {
  NativeWindStyleSheet.setOutput({
    default: "native",
  });

  return (
    <AppNavigation />
  );
}
