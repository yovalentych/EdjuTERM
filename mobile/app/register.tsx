import { router, Link } from "expo-router";
import { StyleSheet, TextInput, View, Pressable, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Title } from "@/components/ui";
import { colors } from "@/constants/theme";

export default function RegisterScreen() {
  return (
    <Screen scroll={true}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Title>Реєстрація</Title>
          <Body>Створіть акаунт, щоб почати роботу</Body>
        </View>

        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                placeholder="Ім'я"
                placeholderTextColor={colors.mutedSoft}
                style={styles.input}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                placeholder="Прізвище"
                placeholderTextColor={colors.mutedSoft}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color={colors.mutedSoft} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={colors.mutedSoft}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color={colors.mutedSoft} style={styles.inputIcon} />
            <TextInput
              placeholder="Пароль"
              placeholderTextColor={colors.mutedSoft}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="shield" size={20} color={colors.mutedSoft} style={styles.inputIcon} />
            <TextInput
              placeholder="Підтвердіть пароль"
              placeholderTextColor={colors.mutedSoft}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <ActionButton label="Зареєструватися" onPress={() => router.replace("/projects")} />
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Вже маєте акаунт? </Text>
            <Link href="/login" asChild>
              <Pressable>
                <Text style={styles.linkText}>Увійти</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "white",
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: colors.muted,
    fontSize: 15,
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
  },
});
