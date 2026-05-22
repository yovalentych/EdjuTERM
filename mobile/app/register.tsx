import { useState, useMemo } from "react";
import { router, Link } from "expo-router";
import {
  ActivityIndicator, StyleSheet, TextInput, View, Pressable, Text, Alert,
} from "react-native";
import * as Icons from "lucide-react-native";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Title } from "@/components/ui";
import { colors, fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useMobileStore, type User } from "@/lib/mobile-store";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/u;

// KMU 2010 Ukrainian → Latin transliteration
const UA_TO_LAT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "’": "",
};
const UA_TO_LAT_INITIAL: Record<string, string> = {
  є: "ye", ї: "yi", й: "y", ю: "yu", я: "ya",
};

function transliterate(value: string): string {
  return value.trim().split(/(\s+|-)/).map(part => {
    if (/^\s+$|^-$/u.test(part)) return part;
    return part.split("").map((ch, i) => {
      const lower = ch.toLowerCase();
      const repl = i === 0 && UA_TO_LAT_INITIAL[lower] ? UA_TO_LAT_INITIAL[lower] : UA_TO_LAT[lower];
      if (repl === undefined) return ch;
      if (ch === lower) return repl;
      return repl.charAt(0).toUpperCase() + repl.slice(1);
    }).join("");
  }).join("");
}

function normalizePhone(v: string): string {
  const cleaned = v.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) return "+" + cleaned.slice(1).replace(/\D/g, "").slice(0, 15);
  return cleaned.replace(/\D/g, "").slice(0, 15);
}

export default function RegisterScreen() {
  const { fetchMe, fetchPersonalProfile, setAuthToken } = useMobileStore();
  const [firstName, setFirstName]           = useState("");
  const [lastName, setLastName]             = useState("");
  const [firstNameLatin, setFirstNameLatin] = useState("");
  const [lastNameLatin, setLastNameLatin]   = useState("");
  const [editedLatin, setEditedLatin]       = useState({ first: false, last: false });
  const [email, setEmail]                   = useState("");
  const [phone, setPhone]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPwd, setConfirm]            = useState("");
  const [showPwd, setShowPwd]               = useState(false);
  const [agreed, setAgreed]                 = useState(false);
  const [loading, setLoading]               = useState(false);
  const [errorMsg, setErrorMsg]             = useState<string | null>(null);

  const autoFirstLatin = useMemo(() => transliterate(firstName), [firstName]);
  const autoLastLatin  = useMemo(() => transliterate(lastName),  [lastName]);
  const firstLatinShown = editedLatin.first ? firstNameLatin : autoFirstLatin;
  const lastLatinShown  = editedLatin.last  ? lastNameLatin  : autoLastLatin;

  const emailValid = email.length === 0 || EMAIL_RE.test(email);
  const phoneValid = phone.length === 0 || PHONE_RE.test(phone);
  const strength   = useMemo(() => passwordStrength(password), [password]);
  const pwdsMatch  = confirmPwd.length === 0 || password === confirmPwd;
  const canSubmit  = firstName.trim().length > 0
                  && lastName.trim().length > 0
                  && firstLatinShown.length > 0
                  && lastLatinShown.length > 0
                  && EMAIL_RE.test(email)
                  && phoneValid
                  && strength.score >= 2
                  && password === confirmPwd
                  && agreed
                  && !loading;

  function updateFirstName(v: string) {
    setFirstName(v);
    if (!editedLatin.first) setFirstNameLatin(transliterate(v));
  }
  function updateLastName(v: string) {
    setLastName(v);
    if (!editedLatin.last) setLastNameLatin(transliterate(v));
  }

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ user: User; token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          firstNameLatin: firstLatinShown.trim(),
          lastNameLatin: lastLatinShown.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          locale: "uk",
        }),
      });

      setAuthToken(res.token);
      await fetchMe(res.token);
      await fetchPersonalProfile(res.token);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/profile");
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const message = error instanceof Error ? error.message : "Не вдалося створити акаунт";
      setErrorMsg(message === "User already exists" ? "Цей email уже зареєстрований" : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Icons.ArrowLeft size={18} color={colors.ink} strokeWidth={2.2} />
        </Pressable>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 18 }}
        style={styles.content}
      >
        <View style={styles.titleContainer}>
          <Title>Реєстрація</Title>
          <Body>Створіть акаунт, щоб почати роботу</Body>
        </View>

        <View style={styles.form}>
          {errorMsg && (
            <MotiView
              from={{ opacity: 0, translateY: -4 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.errorBox}
            >
              <Icons.AlertTriangle size={14} color="#be123c" strokeWidth={2.2} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </MotiView>
          )}

          {/* ── Names (Ukrainian) ───────────────────────────────── */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                placeholder="Ім'я"
                placeholderTextColor={colors.mutedSoft}
                value={firstName}
                onChangeText={updateFirstName}
                style={styles.input}
                autoComplete="name-given"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                placeholder="Прізвище"
                placeholderTextColor={colors.mutedSoft}
                value={lastName}
                onChangeText={updateLastName}
                style={styles.input}
                autoComplete="name-family"
              />
            </View>
          </View>

          {/* ── Latin names (auto-transliteration) ──────────────── */}
          <View style={styles.latinBox}>
            <View style={styles.latinHeader}>
              <Icons.Sparkles size={11} color="#059669" strokeWidth={2.4} />
              <Text style={styles.latinHeaderText}>ЛАТИНИЦЯ — для документів і ORCID</Text>
              {!editedLatin.first && !editedLatin.last && (
                <View style={styles.autoTag}><Text style={styles.autoTagText}>АВТО</Text></View>
              )}
            </View>
            <View style={styles.row}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <TextInput
                  placeholder="First name"
                  placeholderTextColor={colors.mutedSoft}
                  value={firstLatinShown}
                  onChangeText={(v) => { setEditedLatin(c => ({ ...c, first: true })); setFirstNameLatin(v); }}
                  style={styles.input}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                <TextInput
                  placeholder="Last name"
                  placeholderTextColor={colors.mutedSoft}
                  value={lastLatinShown}
                  onChangeText={(v) => { setEditedLatin(c => ({ ...c, last: true })); setLastNameLatin(v); }}
                  style={styles.input}
                  autoCapitalize="words"
                  autoComplete="off"
                />
              </View>
            </View>
            {(editedLatin.first || editedLatin.last) && (
              <Pressable
                onPress={() => {
                  setEditedLatin({ first: false, last: false });
                  setFirstNameLatin(autoFirstLatin);
                  setLastNameLatin(autoLastLatin);
                }}
                hitSlop={6}
              >
                <Text style={styles.restoreLink}>↻ Відновити автотранслітерацію</Text>
              </Pressable>
            )}
          </View>

          {/* ── Email ───────────────────────────────────────────── */}
          <View style={[styles.inputContainer, !emailValid && styles.inputContainerError]}>
            <Icons.Mail size={18} color={colors.mutedSoft} strokeWidth={2} style={styles.inputIcon} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor={colors.mutedSoft}
              style={styles.input}
              autoComplete="email"
            />
            {email.length > 0 && EMAIL_RE.test(email) && (
              <Icons.CheckCircle2 size={16} color="#10b981" strokeWidth={2.2} />
            )}
          </View>
          {!emailValid && <Text style={styles.hintText}>Перевірте формат пошти</Text>}

          {/* ── Phone (optional) ────────────────────────────────── */}
          <View style={[styles.inputContainer, !phoneValid && styles.inputContainerError]}>
            <Icons.Phone size={18} color={colors.mutedSoft} strokeWidth={2} style={styles.inputIcon} />
            <TextInput
              keyboardType="phone-pad"
              placeholder="+380XXXXXXXXX (для SMS, опц.)"
              value={phone}
              onChangeText={(v) => setPhone(normalizePhone(v))}
              placeholderTextColor={colors.mutedSoft}
              style={styles.input}
              autoComplete="tel"
              maxLength={16}
            />
            {phone.length > 0 && phoneValid && (
              <Icons.CheckCircle2 size={16} color="#10b981" strokeWidth={2.2} />
            )}
          </View>
          {!phoneValid && <Text style={styles.hintText}>Формат: +380XXXXXXXXX (7-15 цифр)</Text>}

          {/* ── Password ────────────────────────────────────────── */}
          <View style={styles.inputContainer}>
            <Icons.Lock size={18} color={colors.mutedSoft} strokeWidth={2} style={styles.inputIcon} />
            <TextInput
              placeholder="Пароль"
              placeholderTextColor={colors.mutedSoft}
              secureTextEntry={!showPwd}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              autoComplete="new-password"
            />
            <Pressable onPress={() => setShowPwd(v => !v)} hitSlop={10}>
              {showPwd
                ? <Icons.EyeOff size={18} color={colors.mutedSoft} strokeWidth={2} />
                : <Icons.Eye size={18} color={colors.mutedSoft} strokeWidth={2} />}
            </Pressable>
          </View>

          {/* ── Password strength meter ─────────────────────────── */}
          {password.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      i < strength.score && { backgroundColor: strength.color },
                    ]}
                  />
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                {strength.hint ? <Text style={styles.strengthHint}>{strength.hint}</Text> : null}
              </View>
            </View>
          )}

          {/* ── Confirm password ─────────────────────────────────── */}
          <View style={[styles.inputContainer, !pwdsMatch && styles.inputContainerError]}>
            <Icons.ShieldCheck size={18} color={colors.mutedSoft} strokeWidth={2} style={styles.inputIcon} />
            <TextInput
              placeholder="Підтвердіть пароль"
              placeholderTextColor={colors.mutedSoft}
              secureTextEntry={!showPwd}
              value={confirmPwd}
              onChangeText={setConfirm}
              style={styles.input}
              autoComplete="new-password"
            />
            {confirmPwd.length > 0 && password === confirmPwd && (
              <Icons.CheckCircle2 size={16} color="#10b981" strokeWidth={2.2} />
            )}
          </View>
          {!pwdsMatch && <Text style={styles.hintText}>Паролі не співпадають</Text>}

          {/* ── Terms ────────────────────────────────────────────── */}
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setAgreed(v => !v); }}
            style={styles.checkboxRow}
            hitSlop={4}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
              {agreed && <Icons.Check size={11} color="#fff" strokeWidth={3} />}
            </View>
            <Text style={styles.checkboxLabel}>
              Погоджуюсь з{" "}
              <Text style={styles.checkboxLink} onPress={() => Alert.alert("Умови", "Відкрийте веб-версію для перегляду.")}>
                умовами використання
              </Text>
              {" "}та{" "}
              <Text style={styles.checkboxLink} onPress={() => Alert.alert("Політика", "Відкрийте веб-версію для перегляду.")}>
                політикою конфіденційності
              </Text>
            </Text>
          </Pressable>

          {/* ── Submit ───────────────────────────────────────────── */}
          <View style={{ opacity: canSubmit ? 1 : 0.55, marginTop: 4 }} pointerEvents={canSubmit ? "auto" : "none"}>
            <ActionButton label="Зареєструватися" icon="ArrowRight" onPress={handleSubmit} />
          </View>
          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 4 }} />}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Вже маєте акаунт? </Text>
            <Link href="/login" asChild>
              <Pressable hitSlop={6}>
                <Text style={styles.linkText}>Увійти</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </MotiView>
    </Screen>
  );
}

type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; hint: string; color: string };

function passwordStrength(pwd: string): Strength {
  if (pwd.length === 0) {
    return { score: 0, label: "", hint: "", color: "#cbd5e1" };
  }
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  const final = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const actual = (final || 1) as 1 | 2 | 3 | 4;

  if (actual <= 1) return {
    score: actual, label: "Слабкий", color: "#be123c",
    hint: "Min 8 символів, велика літера, цифра",
  };
  if (actual === 2) return {
    score: actual, label: "Прийнятний", color: "#d97706",
    hint: "Додайте спецсимвол",
  };
  if (actual === 3) return {
    score: actual, label: "Хороший", color: "#10b981", hint: "",
  };
  return { score: 4, label: "Дуже надійний", color: "#059669", hint: "" };
}

const styles = StyleSheet.create({
  header: { paddingVertical: 10 },
  backButton: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12, backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#0b1626", shadowOpacity: 0.06, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  content: { flex: 1, paddingTop: 16, paddingBottom: 40 },
  titleContainer: { marginBottom: 24 },
  form: { gap: 12 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "rgba(190,18,60,0.08)",
    borderWidth: 0.5, borderColor: "rgba(190,18,60,0.3)",
    borderRadius: 12,
  },
  errorText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 12, color: "#be123c", letterSpacing: -0.1 },
  row: { flexDirection: "row", gap: 10 },

  inputContainer: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 14, backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 14, gap: 8,
    shadowColor: "#0b1626", shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  inputContainerError: { borderColor: "rgba(190,18,60,0.35)", borderWidth: 1 },
  inputIcon: { marginRight: 2 },
  input: {
    fontFamily: fonts.regular, flex: 1, paddingVertical: 14,
    color: colors.ink, fontSize: 15,
  },
  hintText: { fontFamily: fonts.regular, fontSize: 11, color: "#be123c", paddingLeft: 4 },

  // Latin transliteration box
  latinBox:        { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(16,185,129,0.25)", backgroundColor: "rgba(16,185,129,0.06)", gap: 8 },
  latinHeader:     { flexDirection: "row", alignItems: "center", gap: 6 },
  latinHeaderText: { fontFamily: fonts.bold, fontSize: 9.5, letterSpacing: 1.2, color: "#059669", flex: 1 },
  autoTag:         { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(5,150,105,0.15)" },
  autoTagText:     { fontFamily: fonts.bold, fontSize: 8, color: "#059669", letterSpacing: 0.6 },
  restoreLink:     { fontFamily: fonts.bold, fontSize: 11, color: "#059669", marginTop: 2 },

  // Strength meter
  strengthWrap:  { paddingHorizontal: 2, gap: 4 },
  strengthBars:  { flexDirection: "row", gap: 4 },
  strengthBar:   { flex: 1, height: 4, borderRadius: 2, backgroundColor: "#e2e8f0" },
  strengthLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: -0.1 },
  strengthHint:  { fontFamily: fonts.regular, fontSize: 10, color: colors.mutedSoft, flexShrink: 1, textAlign: "right" },

  // Checkbox
  checkboxRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 2, marginTop: 4 },
  checkbox: {
    width: 18, height: 18, borderRadius: 5, marginTop: 1,
    borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { flex: 1, fontFamily: fonts.regular, fontSize: 11.5, color: colors.muted, letterSpacing: -0.1, lineHeight: 16 },
  checkboxLink: { fontFamily: fonts.bold, color: colors.primary },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  footerText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 14 },
  linkText:   { fontFamily: fonts.bold, color: colors.primary, fontSize: 14 },
});
