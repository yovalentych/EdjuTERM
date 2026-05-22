import { useEffect, useState, useMemo } from "react";
import {
  KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import * as Icons from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "@/constants/theme";
import { apiRequest } from "@/lib/api";
import { useMobileStore, type User } from "@/lib/mobile-store";

const PHONE_RE = /^\+?[1-9]\d{6,14}$/u;

// KMU 2010 Ukrainian → Latin transliteration (як на register)
const UA_TO_LAT: Record<string, string> = {
  а:"a",б:"b",в:"v",г:"h",ґ:"g",д:"d",е:"e",є:"ie",ж:"zh",
  з:"z",и:"y",і:"i",ї:"i",й:"i",к:"k",л:"l",м:"m",н:"n",
  о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",
  ч:"ch",ш:"sh",щ:"shch",ь:"",ю:"iu",я:"ia","'":"","’":"",
};
const UA_TO_LAT_INITIAL: Record<string, string> = {
  є:"ye",ї:"yi",й:"y",ю:"yu",я:"ya",
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

export function ProfileEditorSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { user, personalProfile, authToken, fetchMe, fetchPersonalProfile } = useMobileStore();
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [firstName, setFirstName]       = useState(user?.firstName ?? "");
  const [lastName, setLastName]         = useState(user?.lastName ?? "");
  const [firstNameLatin, setFirstLatin] = useState(user?.firstNameLatin ?? "");
  const [lastNameLatin, setLastLatin]   = useState(user?.lastNameLatin ?? "");
  const [editedLatin, setEditedLatin]   = useState({ first: !!user?.firstNameLatin, last: !!user?.lastNameLatin });
  const [phone, setPhone]               = useState(user?.phone ?? "");
  const [orcid, setOrcid]               = useState(user?.orcid ?? "");
  const [position, setPosition]         = useState(user?.position ?? "");
  const [affiliation, setAffiliation]   = useState(user?.affiliation ?? "");
  const [profileBio, setProfileBio]     = useState(user?.profileBio ?? "");
  const [institutionName, setInstitutionName] = useState("");
  const [unitName, setUnitName] = useState("");
  const [programName, setProgramName] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [googleScholar, setGoogleScholar] = useState("");
  const [scopus, setScopus] = useState("");
  const [website, setWebsite] = useState("");
  const [researchInterests, setResearchInterests] = useState("");

  useEffect(() => {
    if (!visible) return;
    const source = personalProfile;
    setFirstName(source?.firstName ?? user?.firstName ?? "");
    setLastName(source?.lastName ?? user?.lastName ?? "");
    setFirstLatin(source?.firstNameLatin ?? user?.firstNameLatin ?? "");
    setLastLatin(source?.lastNameLatin ?? user?.lastNameLatin ?? "");
    setEditedLatin({
      first: Boolean(source?.firstNameLatin || user?.firstNameLatin),
      last: Boolean(source?.lastNameLatin || user?.lastNameLatin),
    });
    setPhone(source?.phone ?? user?.phone ?? "");
    setOrcid(source?.orcid ?? user?.orcid ?? "");
    setPosition(source?.position ?? user?.position ?? "");
    setAffiliation(source?.affiliation ?? user?.affiliation ?? "");
    setProfileBio(source?.profileBio ?? user?.profileBio ?? "");
    const primaryInstitution = source?.institutions?.find((item) => item.isPrimary) ?? source?.institutions?.[0];
    setInstitutionName(primaryInstitution?.institutionName ?? "");
    setUnitName(primaryInstitution?.unitName ?? "");
    setProgramName(primaryInstitution?.programName ?? "");
    setEducationLevel(primaryInstitution?.educationLevel ?? "");
    setGoogleScholar(source?.links?.find((item) => item.kind === "google_scholar")?.url ?? "");
    setScopus(source?.links?.find((item) => item.kind === "scopus")?.value ?? "");
    setWebsite(source?.links?.find((item) => item.kind === "website")?.url ?? "");
    setResearchInterests((source?.researchInterests ?? []).join(", "));
  }, [personalProfile, user, visible]);

  const autoFirstLatin = useMemo(() => transliterate(firstName), [firstName]);
  const autoLastLatin  = useMemo(() => transliterate(lastName),  [lastName]);
  const firstLatinShown = editedLatin.first ? firstNameLatin : autoFirstLatin;
  const lastLatinShown  = editedLatin.last  ? lastNameLatin  : autoLastLatin;

  const phoneValid = phone.length === 0 || PHONE_RE.test(phone);
  const canSubmit  = firstName.trim().length > 0 && lastName.trim().length > 0 && phoneValid && !pending;

  function normalizePhone(v: string): string {
    const cleaned = v.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return "+" + cleaned.slice(1).replace(/\D/g, "").slice(0, 15);
    return cleaned.replace(/\D/g, "").slice(0, 15);
  }

  async function handleSave() {
    if (!canSubmit) return;
    setErrorMsg(null);
    setPending(true);
    try {
      await apiRequest<{ user: User }>("/api/profile", {
        method: "PATCH",
        token: authToken || undefined,
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          firstNameLatin: firstLatinShown.trim() || undefined,
          lastNameLatin: lastLatinShown.trim() || undefined,
          phone: phone.replace(/\s+/g, "") || undefined,
          orcid: orcid.trim() || undefined,
          position: position.trim() || undefined,
          affiliation: affiliation.trim() || undefined,
          profileBio: profileBio.trim() || undefined,
          researchInterests: researchInterests
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 20),
          institutions: institutionName.trim()
            ? [{
                institutionName: institutionName.trim(),
                unitName: unitName.trim(),
                programName: programName.trim(),
                educationLevel: educationLevel.trim(),
                position: position.trim(),
                isCurrent: true,
                isPrimary: true,
              }]
            : [],
          links: [
            orcid.trim() ? { kind: "orcid", label: "ORCID", value: orcid.trim(), url: orcid.trim().startsWith("http") ? orcid.trim() : `https://orcid.org/${orcid.trim()}`, isPrimary: true } : null,
            googleScholar.trim() ? { kind: "google_scholar", label: "Google Scholar", value: "", url: googleScholar.trim(), isPrimary: false } : null,
            scopus.trim() ? { kind: "scopus", label: "Scopus", value: scopus.trim(), url: "", isPrimary: false } : null,
            website.trim() ? { kind: "website", label: "Website", value: "", url: website.trim(), isPrimary: false } : null,
          ].filter(Boolean),
          onboardingCompleted: true,
        }),
      });
      await fetchMe();
      await fetchPersonalProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "Помилка збереження");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setPending(false);
    }
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} />

        <MotiView
          from={{ translateY: 40, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 18 }}
          style={[s.sheet, { top: insets.top + 8 }]}
      >
          <BlurView intensity={Platform.OS === "ios" ? 80 : 100} tint="light" style={StyleSheet.absoluteFill}>
            <LinearGradient colors={["rgba(255,255,255,0.95)", "rgba(238,243,248,0.95)"]} style={StyleSheet.absoluteFill} />
          </BlurView>

          <View style={s.handle} />

          <View style={s.header}>
            <View>
              <Text style={s.title}>Персональна база</Text>
              <Text style={s.sub}>Дані для автозаповнення курсів, публікацій і документів</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={s.closeBtn}>
              <Icons.X size={18} color={colors.muted} />
            </Pressable>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.keyboardArea}>
            <ScrollView
              contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 24 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {errorMsg && (
                <View style={s.errorBox}>
                  <Icons.AlertTriangle size={14} color="#be123c" />
                  <Text style={s.errorText}>{errorMsg}</Text>
                </View>
              )}

              <View style={s.row}>
                <Field label="Ім'я" required style={{ flex: 1 }}>
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    style={s.input}
                    autoComplete="name-given"
                  />
                </Field>
                <Field label="Прізвище" required style={{ flex: 1 }}>
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    style={s.input}
                    autoComplete="name-family"
                  />
                </Field>
              </View>

              <View style={s.latinBox}>
                <View style={s.latinHeader}>
                  <Icons.Sparkles size={11} color="#059669" strokeWidth={2.4} />
                  <Text style={s.latinHeaderText}>ЛАТИНИЦЯ — для документів і ORCID</Text>
                  {!editedLatin.first && !editedLatin.last && (
                    <View style={s.autoTag}><Text style={s.autoTagText}>АВТО</Text></View>
                  )}
                </View>
                <View style={s.row}>
                  <Field label="First" style={{ flex: 1 }}>
                    <TextInput
                      value={firstLatinShown}
                      onChangeText={(v) => { setEditedLatin(c => ({ ...c, first: true })); setFirstLatin(v); }}
                      style={s.input}
                      autoCapitalize="words"
                    />
                  </Field>
                  <Field label="Last" style={{ flex: 1 }}>
                    <TextInput
                      value={lastLatinShown}
                      onChangeText={(v) => { setEditedLatin(c => ({ ...c, last: true })); setLastLatin(v); }}
                      style={s.input}
                      autoCapitalize="words"
                    />
                  </Field>
                </View>
                {(editedLatin.first || editedLatin.last) && (
                  <Pressable
                    onPress={() => {
                      setEditedLatin({ first: false, last: false });
                      setFirstLatin(autoFirstLatin);
                      setLastLatin(autoLastLatin);
                    }}
                    hitSlop={6}
                  >
                    <Text style={s.restoreLink}>↻ Відновити автотранслітерацію</Text>
                  </Pressable>
                )}
              </View>

              <Field label="Телефон" hint={!phoneValid ? "Формат: +380XXXXXXXXX (7-15 цифр)" : undefined}>
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="+380XXXXXXXXX"
                  value={phone}
                  onChangeText={(v) => setPhone(normalizePhone(v))}
                  placeholderTextColor={colors.mutedSoft}
                  style={s.input}
                  autoComplete="tel"
                  maxLength={16}
                />
              </Field>

              <View style={s.sectionBox}>
                <Text style={s.sectionTitle}>Освітня установа</Text>
                <Field label="Заклад освіти / наукова установа">
                  <TextInput
                    value={institutionName}
                    onChangeText={setInstitutionName}
                    placeholder="Інститут, університет, академія"
                    placeholderTextColor={colors.mutedSoft}
                    style={s.input}
                  />
                </Field>
                <Field label="Підрозділ">
                  <TextInput
                    value={unitName}
                    onChangeText={setUnitName}
                    placeholder="Кафедра, відділ, лабораторія"
                    placeholderTextColor={colors.mutedSoft}
                    style={s.input}
                  />
                </Field>
                <View style={s.row}>
                  <Field label="Програма" style={{ flex: 1 }}>
                    <TextInput
                      value={programName}
                      onChangeText={setProgramName}
                      placeholder="Освітня програма"
                      placeholderTextColor={colors.mutedSoft}
                      style={s.input}
                    />
                  </Field>
                  <Field label="Рівень" style={{ flex: 1 }}>
                    <TextInput
                      value={educationLevel}
                      onChangeText={setEducationLevel}
                      placeholder="PhD, магістр..."
                      placeholderTextColor={colors.mutedSoft}
                      style={s.input}
                    />
                  </Field>
                </View>
              </View>

              <Field label="ORCID">
                <TextInput
                  value={orcid}
                  onChangeText={setOrcid}
                  placeholder="0000-0000-0000-0000"
                  placeholderTextColor={colors.mutedSoft}
                  style={s.input}
                />
              </Field>

              <View style={s.sectionBox}>
                <Text style={s.sectionTitle}>Наукові профілі</Text>
                <Field label="Google Scholar">
                  <TextInput
                    value={googleScholar}
                    onChangeText={setGoogleScholar}
                    placeholder="https://scholar.google.com/..."
                    placeholderTextColor={colors.mutedSoft}
                    style={s.input}
                    autoCapitalize="none"
                  />
                </Field>
                <Field label="Scopus Author ID">
                  <TextInput
                    value={scopus}
                    onChangeText={setScopus}
                    placeholder="Author ID"
                    placeholderTextColor={colors.mutedSoft}
                    style={s.input}
                    autoCapitalize="none"
                  />
                </Field>
                <Field label="Персональний сайт">
                  <TextInput
                    value={website}
                    onChangeText={setWebsite}
                    placeholder="https://..."
                    placeholderTextColor={colors.mutedSoft}
                    style={s.input}
                    autoCapitalize="none"
                  />
                </Field>
              </View>

              <Field label="Посада">
                <TextInput
                  value={position}
                  onChangeText={setPosition}
                  placeholder="Аспірант, дослідник, викладач…"
                  placeholderTextColor={colors.mutedSoft}
                  style={s.input}
                />
              </Field>

              <Field label="Афіліація">
                <TextInput
                  value={affiliation}
                  onChangeText={setAffiliation}
                  placeholder="Інститут, кафедра"
                  placeholderTextColor={colors.mutedSoft}
                  style={s.input}
                />
              </Field>

              <Field label="Наукові інтереси">
                <TextInput
                  value={researchInterests}
                  onChangeText={setResearchInterests}
                  placeholder="геноміка, машинне навчання, біоінформатика"
                  placeholderTextColor={colors.mutedSoft}
                  style={s.input}
                />
              </Field>

              <Field label="Про себе">
                <TextInput
                  value={profileBio}
                  onChangeText={setProfileBio}
                  placeholder="Коротка біографія, інтереси"
                  placeholderTextColor={colors.mutedSoft}
                  multiline
                  numberOfLines={3}
                  style={[s.input, { minHeight: 76, textAlignVertical: "top", paddingTop: 12 }]}
                />
              </Field>

              <Pressable
                onPress={handleSave}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  s.saveBtn,
                  !canSubmit && { opacity: 0.55 },
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
              >
                {pending
                  ? <Icons.Loader2 size={16} color="#fff" />
                  : <Icons.Save size={16} color="#fff" strokeWidth={2.4} />}
                <Text style={s.saveBtnText}>{pending ? "Зберігаємо..." : "Зберегти"}</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </MotiView>
      </View>
    </Modal>
  );
}

function Field({
  label,
  required,
  hint,
  style,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  style?: any;
  children: React.ReactNode;
}) {
  return (
    <View style={[{ gap: 4 }, style]}>
      <Text style={s.label}>
        {label} {required && <Text style={{ color: "#be123c" }}>*</Text>}
      </Text>
      {children}
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, zIndex: 1500 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(15,23,42,0.45)" },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 }, shadowOpacity: 0.18, shadowRadius: 24,
    elevation: 16,
  },
  handle: { alignSelf: "center", marginTop: 10, marginBottom: 4, width: 44, height: 5, borderRadius: 3, backgroundColor: "#cbd5e1" },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingTop: 6, paddingBottom: 14 },
  title: { fontSize: 18, fontFamily: fonts.title, color: colors.ink, letterSpacing: -0.4 },
  sub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(100,116,139,0.12)", alignItems: "center", justifyContent: "center" },
  keyboardArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 18, gap: 12 },

  row: { flexDirection: "row", gap: 10 },

  label: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.2, color: colors.mutedSoft, textTransform: "uppercase" },
  hint: { fontFamily: fonts.regular, fontSize: 11, color: "#be123c", paddingLeft: 2 },

  input: {
    fontFamily: fonts.regular, fontSize: 14,
    paddingHorizontal: 12, paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 0.5, borderColor: "rgba(255,255,255,0.7)",
    backgroundColor: "rgba(255,255,255,0.85)",
    color: colors.ink,
    shadowColor: "#0b1626", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "rgba(190,18,60,0.08)",
    borderRadius: 12,
    borderWidth: 0.5, borderColor: "rgba(190,18,60,0.3)",
  },
  errorText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 12, color: "#be123c" },

  latinBox: {
    padding: 12, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.25)",
    backgroundColor: "rgba(16,185,129,0.06)",
    gap: 8,
  },
  latinHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  latinHeaderText: { fontFamily: fonts.bold, fontSize: 9.5, letterSpacing: 1.2, color: "#059669", flex: 1 },
  autoTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: "rgba(5,150,105,0.15)" },
  autoTagText: { fontFamily: fonts.bold, fontSize: 8, color: "#059669", letterSpacing: 0.6 },
  restoreLink: { fontFamily: fonts.bold, fontSize: 11, color: "#059669", marginTop: 2 },
  sectionBox: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15,118,110,0.18)",
    backgroundColor: "rgba(15,118,110,0.05)",
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.1,
    color: colors.primary,
    textTransform: "uppercase",
  },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginTop: 8,
    shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  saveBtnText: { color: "#fff", fontFamily: fonts.bold, fontSize: 14, letterSpacing: -0.2 },
});
