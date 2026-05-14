import { View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Card, Eyebrow, Title } from "@/components/ui";
import { colors } from "@/constants/theme";
import { apiConfig } from "@/lib/api";
import { useMobileStore } from "@/lib/mobile-store";

export default function ProfileScreen() {
  const { setActiveProject } = useMobileStore();
  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Feather name="user" size={40} color={colors.primary} />
        </View>
        <Title>Йован Валентич</Title>
        <Body>Адмін · Мобільний режим</Body>
      </View>

      <Card>
        <Eyebrow>Налаштування API</Eyebrow>
        <View style={styles.infoRow}>
          <Feather name="globe" size={16} color={colors.mutedSoft} />
          <Body style={styles.infoText}>{apiConfig.baseUrl}</Body>
        </View>
        <Body style={styles.note}>
          Для підключення з реального пристрою в Expo Go використовуйте LAN IP замість localhost.
        </Body>
      </Card>

      <Card>
        <Eyebrow>Робочий простір</Eyebrow>
        <ActionButton 
          label="Змінити проєкт" 
          variant="secondary" 
          icon="layers" 
          onPress={() => router.push("/projects")}
        />
      </Card>

      <Card>
        <Eyebrow>Допомога</Eyebrow>
        <ActionButton label="Документація" variant="ghost" icon="book-open" />
        <ActionButton label="Зворотній зв'язок" variant="ghost" icon="message-circle" />
      </Card>

      <ActionButton 
        label="Вийти" 
        variant="secondary" 
        icon="log-out" 
        onPress={() => {
          setActiveProject(null, false);
          router.replace("/login");
        }}
      />
      
      <View style={styles.bottomSpacer} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    marginVertical: 20,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  infoText: {
    fontWeight: "600",
    color: colors.ink,
  },
  note: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
  bottomSpacer: {
    height: 80,
  },
});
