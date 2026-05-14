import { useState } from "react";
import { router, Link } from "expo-router";
import { StyleSheet, TextInput, View, Pressable, Text, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Title } from "@/components/ui";
import { colors, fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useMobileStore } from "@/lib/mobile-store";

export default function LoginScreen() {
  const { fetchMe } = useMobileStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Помилка", "Будь ласка, введіть email та пароль");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      
      const user = await fetchMe();
      if (user) {
        router.replace("/projects");
      } else {
        throw new Error("Failed to verify session");
      }
    } catch (error) {
      Alert.alert("Помилка входу", error instanceof Error ? error.message : "Невірний email або пароль");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Title>З поверненням</Title>
          <Body>Увійдіть у свій дослідницький контур</Body>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color={colors.mutedSoft} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={colors.mutedSoft}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color={colors.mutedSoft} style={styles.inputIcon} />
            <TextInput
              placeholder="Пароль"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor={colors.mutedSoft}
              secureTextEntry
              style={styles.input}
            />
          </View>

          <ActionButton 
            label={loading ? "Вхід..." : "Увійти"} 
            onPress={handleLogin} 
          />
          
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Немає акаунту? </Text>
            <Link href="/register" asChild>
              <Pressable>
                <Text style={styles.linkText}>Зареєструватися</Text>
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
    paddingTop: 40,
  },
  titleContainer: {
    marginBottom: 32,
  },
  form: {
    gap: 16,
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
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
    color: colors.muted,
    fontSize: 15,
  },
  linkText: {
    fontFamily: fonts.bold,
    color: colors.primary,
    fontSize: 15,
  },
});
