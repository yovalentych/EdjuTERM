import { View, Text, Pressable, Alert, Linking } from "react-native";
import * as Icons from "lucide-react-native";
import { useState } from "react";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { s } from "./styles";

const REPORT_TYPES = [
  { id: "inventory",   label: "Склад реагентів",   sub: "Повний перелік із GHS, статусами та термінами",       Icon: Icons.Package,      color: "#dc2626" },
  { id: "equipment",   label: "Стан обладнання",   sub: "Список приладів, статуси та календар калібрувань",    Icon: Icons.Microscope,   color: "#d97706" },
  { id: "glp",         label: "GLP-Журнал",         sub: "Лабораторні записи за весь період",                  Icon: Icons.BookOpen,     color: "#0f766e" },
  { id: "waste",       label: "Акти утилізації",    sub: "Журнал утилізованих відходів по категоріях",         Icon: Icons.Recycle,      color: "#0d9488" },
  { id: "experiments", label: "Звіт по дослідах",   sub: "Перелік експериментів зі статусами та SOP",          Icon: Icons.FlaskConical, color: "#7c3aed" },
] as const;

function buildInventoryHtml(inventory: any[], project: any) {
  const date = new Date().toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });
  const rows = inventory.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="font-family:monospace">${item.casNumber || "—"}</td>
      <td>${item.quantity} ${item.unit}</td>
      <td><span style="color:${item.status==="in_stock"?"#059669":item.status==="low_stock"?"#d97706":"#dc2626"}">${
        item.status==="in_stock"?"В наявності":item.status==="low_stock"?"Залишок":item.status==="depleted"?"Відсутній":"Прострочено"
      }</span></td>
      <td>${item.hazardClass !== "none" ? item.hazardClass.toUpperCase() : "—"}</td>
      <td>${item.location || "—"}</td>
      <td>${item.expirationDate ? new Date(item.expirationDate).toLocaleDateString("uk-UA") : "—"}</td>
      <td>${item.manufacturer || "—"}</td>
    </tr>`).join("");
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"/>
  <style>body{font-family:sans-serif;padding:24px;color:#1e293b;font-size:13px}h1{color:#0f5c50;margin-bottom:4px}.meta{color:#64748b;font-size:11px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:8px 6px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0}td{padding:8px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}tr:hover td{background:#f8fafc}.footer{margin-top:32px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style></head><body>
  <h1>Інвентарний опис складу</h1>
  <div class="meta">${project?.title || "Лабораторія"} · Сформовано ${date} · ${inventory.length} позицій</div>
  <table><thead><tr><th>Назва</th><th>CAS</th><th>Кількість</th><th>Статус</th><th>Небезпека</th><th>Локація</th><th>Термін</th><th>Виробник</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">GLP-відповідний звіт · EdjuTERM Laboratory Module</div></body></html>`;
}

function buildEquipmentHtml(equipment: any[], project: any) {
  const date = new Date().toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });
  const rows = equipment.map(eq => {
    const cal     = eq.nextCalibrationDate ? new Date(eq.nextCalibrationDate) : null;
    const calDays = cal ? Math.floor((cal.getTime() - Date.now()) / (24 * 3600 * 1000)) : null;
    const calColor = calDays === null ? "#64748b" : calDays < 0 ? "#dc2626" : calDays < 14 ? "#dc2626" : calDays < 60 ? "#d97706" : "#059669";
    return `<tr>
      <td>${eq.name}</td>
      <td>${[eq.manufacturer, eq.model].filter(Boolean).join(" ")}</td>
      <td style="font-family:monospace">${eq.serialNumber || "—"}</td>
      <td><span style="color:${eq.status==="operational"?"#059669":eq.status==="maintenance"?"#d97706":"#dc2626"}">${eq.status==="operational"?"Працює":eq.status==="maintenance"?"Обслуговування":eq.status==="out_of_order"?"Несправний":"Списаний"}</span></td>
      <td>${eq.location || "—"}</td>
      <td style="color:${calColor}">${calDays === null ? "—" : calDays < 0 ? "Прострочено" : `${calDays} дн.`}</td>
    </tr>`;
  }).join("");
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"/>
  <style>body{font-family:sans-serif;padding:24px;color:#1e293b;font-size:13px}h1{color:#d97706;margin-bottom:4px}.meta{color:#64748b;font-size:11px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#fefce8;padding:8px 6px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #fde68a}td{padding:8px 6px;border-bottom:1px solid #f1f5f9}.footer{margin-top:32px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style></head><body>
  <h1>Технічний стан обладнання</h1>
  <div class="meta">${project?.title || "Лабораторія"} · Сформовано ${date} · ${equipment.length} приладів</div>
  <table><thead><tr><th>Назва</th><th>Виробник / модель</th><th>S/N</th><th>Статус</th><th>Локація</th><th>Калібрування</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">GLP-відповідний звіт · EdjuTERM Laboratory Module</div></body></html>`;
}

function buildGlpHtml(entries: any[], project: any) {
  const date = new Date().toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });
  const typeColor: Record<string, string> = { observation:"#0369a1", protocol:"#7c3aed", result:"#059669", anomaly:"#dc2626", technical_failure:"#dc2626", note:"#64748b" };
  const rows = entries.map(e => `<tr>
    <td>${e.date}</td>
    <td><span style="color:${typeColor[e.type]||"#64748b"};font-weight:bold;text-transform:uppercase;font-size:10px">${e.type}</span></td>
    <td><strong>${e.title}</strong></td>
    <td>${e.body}</td>
    <td>${e.author || "—"}</td>
  </tr>`).join("");
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"/>
  <style>body{font-family:sans-serif;padding:24px;color:#1e293b;font-size:12px}h1{color:#0f5c50;margin-bottom:4px}.meta{color:#64748b;font-size:11px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f0fdf4;padding:8px 6px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #bbf7d0}td{padding:8px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}.footer{margin-top:32px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style></head><body>
  <h1>GLP-Журнал</h1>
  <div class="meta">${project?.title || "Лабораторія"} · Сформовано ${date} · ${entries.length} записів</div>
  <table><thead><tr><th>Дата</th><th>Тип</th><th>Заголовок</th><th>Зміст</th><th>Автор</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">GLP-відповідний журнал · EdjuTERM Laboratory Module</div></body></html>`;
}

function buildWasteHtml(records: any[], project: any) {
  const date = new Date().toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });
  const catLabel: Record<string, string> = { chemical:"Хімічні", biological:"Біологічні", sharp:"Гострі предмети", radioactive:"Радіоактивні", other:"Інші" };
  const rows = records.map(r => `<tr>
    <td>${r.date}</td><td>${catLabel[r.category] || r.category}</td><td>${r.reagentName}</td>
    <td>${r.quantity > 0 ? `${r.quantity} ${r.unit}` : r.unit}</td>
    <td>${r.disposalMethod}</td><td>${r.handledBy || "—"}</td><td>${r.notes || "—"}</td>
  </tr>`).join("");
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"/>
  <style>body{font-family:sans-serif;padding:24px;color:#1e293b;font-size:12px}h1{color:#0d9488;margin-bottom:4px}.meta{color:#64748b;font-size:11px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f0fdfa;padding:8px 6px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #99f6e4}td{padding:8px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}.footer{margin-top:32px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style></head><body>
  <h1>Акти утилізації відходів</h1>
  <div class="meta">${project?.title || "Лабораторія"} · Сформовано ${date} · ${records.length} актів</div>
  <table><thead><tr><th>Дата</th><th>Категорія</th><th>Речовина</th><th>Кількість</th><th>Метод</th><th>Відповідальний</th><th>Примітка</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">Журнал утилізації відходів · GLP-відповідний · EdjuTERM Laboratory Module</div></body></html>`;
}

function buildExperimentsHtml(experiments: any[], project: any) {
  const date = new Date().toLocaleDateString("uk-UA", { day: "2-digit", month: "long", year: "numeric" });
  const statusLabel: Record<string, string> = { planned:"Заплановано", active:"Активний", completed:"Завершено", failed:"Провалено", paused:"Призупинено" };
  const statusColor: Record<string, string> = { planned:"#0369a1", active:"#059669", completed:"#7c3aed", failed:"#dc2626", paused:"#64748b" };
  const rows = experiments.map(e => {
    const done  = e.steps ? e.steps.filter((step: any) => step.done).length : 0;
    const total = e.steps ? e.steps.length : 0;
    return `<tr>
      <td><strong>${e.title}</strong>${e.hypothesis ? `<br/><em style="color:#64748b;font-size:11px">${e.hypothesis}</em>` : ""}</td>
      <td>${e.experimentType || "—"}</td>
      <td style="color:${statusColor[e.status]||"#64748b"};font-weight:bold">${statusLabel[e.status] || e.status}</td>
      <td>${total > 0 ? `${done}/${total}` : "—"}</td>
      <td>${e.startDate ? new Date(e.startDate).toLocaleDateString("uk-UA") : "—"}</td>
      <td>${e.endDate   ? new Date(e.endDate).toLocaleDateString("uk-UA")   : "—"}</td>
    </tr>`;
  }).join("");
  return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"/>
  <style>body{font-family:sans-serif;padding:24px;color:#1e293b;font-size:12px}h1{color:#7c3aed;margin-bottom:4px}.meta{color:#64748b;font-size:11px;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#faf5ff;padding:8px 6px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;border-bottom:2px solid #e9d5ff}td{padding:8px 6px;border-bottom:1px solid #f1f5f9;vertical-align:top}.footer{margin-top:32px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style></head><body>
  <h1>Звіт по дослідах</h1>
  <div class="meta">${project?.title || "Лабораторія"} · Сформовано ${date} · ${experiments.length} дослідів</div>
  <table><thead><tr><th>Дослід / Гіпотеза</th><th>Тип</th><th>Статус</th><th>SOP</th><th>Початок</th><th>Завершення</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">EdjuTERM Laboratory Module</div></body></html>`;
}

type GeneratedFile = { uri: string; filename: string; reportId: string };

function buildZenodoXml(project: any, experiments: any[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const title = project?.title ?? "Laboratory Research Data";
  const exps  = experiments
    .filter(e => e.status === "completed")
    .map(e => `        <relatedIdentifier relatedIdentifierType="IsPartOf" relationType="IsPartOf">${e.title}</relatedIdentifier>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<resource xmlns="http://datacite.org/schema/kernel-4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://datacite.org/schema/kernel-4 https://schema.datacite.org/meta/kernel-4.4/metadata.xsd">
  <identifier identifierType="DOI">10.XXXXX/PENDING</identifier>
  <creators>
    <creator>
      <creatorName nameType="Personal">LASTNAME, Firstname</creatorName>
    </creator>
  </creators>
  <titles>
    <title>${title} — Laboratory Dataset</title>
  </titles>
  <publisher>EdjuTERM Research Platform</publisher>
  <publicationYear>${today.slice(0, 4)}</publicationYear>
  <resourceType resourceTypeGeneral="Dataset">Laboratory Research Data</resourceType>
  <descriptions>
    <description descriptionType="Abstract">
      GLP-compliant laboratory dataset generated by EdjuTERM Laboratory Module.
      Project: ${title}. Contains inventory, equipment status, experiment records and waste disposal acts.
      Generated: ${today}.
    </description>
  </descriptions>${exps ? `\n  <relatedIdentifiers>\n${exps}\n  </relatedIdentifiers>` : ""}
</resource>`;
}

export function ReportsModule({ labInventory, labEquipment, labExperiments, diaryEntries, wasteRecords, project }: any) {
  const [generating, setGenerating]       = useState<string | null>(null);
  const [lastFile, setLastFile]           = useState<GeneratedFile | null>(null);
  const [zenodoGenerating, setZenodoGen]  = useState(false);

  async function generate(reportId: string) {
    setGenerating(reportId);
    setLastFile(null);
    try {
      let html = "";
      let filename = "report";
      switch (reportId) {
        case "inventory":
          html = buildInventoryHtml(labInventory, project);
          filename = `inventory_${new Date().toISOString().slice(0, 10)}`;
          break;
        case "equipment":
          html = buildEquipmentHtml(labEquipment, project);
          filename = `equipment_${new Date().toISOString().slice(0, 10)}`;
          break;
        case "glp":
          if (diaryEntries.length === 0) { Alert.alert("Порожньо", "GLP-журнал не містить записів."); setGenerating(null); return; }
          html = buildGlpHtml(diaryEntries, project);
          filename = `glp_journal_${new Date().toISOString().slice(0, 10)}`;
          break;
        case "waste":
          if (wasteRecords.length === 0) { Alert.alert("Порожньо", "Журнал відходів не містить записів."); setGenerating(null); return; }
          html = buildWasteHtml(wasteRecords, project);
          filename = `waste_report_${new Date().toISOString().slice(0, 10)}`;
          break;
        case "experiments":
          if (labExperiments.length === 0) { Alert.alert("Порожньо", "Список дослідів порожній."); setGenerating(null); return; }
          html = buildExperimentsHtml(labExperiments, project);
          filename = `experiments_${new Date().toISOString().slice(0, 10)}`;
          break;
      }
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      setLastFile({ uri, filename, reportId });
      await shareFile(uri, filename);
    } catch {
      Alert.alert("Помилка", "Не вдалося сформувати PDF. Спробуйте ще раз.");
    } finally {
      setGenerating(null);
    }
  }

  async function shareFile(uri: string, filename: string) {
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: `${filename}.pdf`, UTI: "com.adobe.pdf" });
    } else {
      Alert.alert("Помилка", "Sharing не доступний на цьому пристрої.");
    }
  }

  async function generateZenodo() {
    setZenodoGen(true);
    try {
      const xml = buildZenodoXml(project, labExperiments);
      const filename = `zenodo_datacite_${new Date().toISOString().slice(0, 10)}`;
      const { uri } = await Print.printToFileAsync({ html: `<html><body><pre style="font-size:11px;word-break:break-all">${xml.replace(/</g, "&lt;")}</pre></body></html>`, base64: false });
      await shareFile(uri, filename);
    } catch {
      Alert.alert("Помилка", "Не вдалося сформувати XML.");
    } finally {
      setZenodoGen(false);
    }
  }

  async function sendEmail(file: GeneratedFile) {
    const repLabel = REPORT_TYPES.find(r => r.id === file.reportId)?.label ?? "Звіт";
    const subject  = encodeURIComponent(`[EdjuTERM] ${repLabel} — ${project?.title ?? "Лабораторія"} · ${new Date().toLocaleDateString("uk-UA")}`);
    const body     = encodeURIComponent(
      `Доброго дня,\n\nНадсилаю звіт: ${repLabel}\nПроєкт: ${project?.title ?? "Лабораторія"}\nДата: ${new Date().toLocaleDateString("uk-UA")}\n\nФайл PDF прикріплено окремо через Share (натисніть "Поділитись" ще раз).\n\n-- EdjuTERM Laboratory Module`
    );
    const url = `mailto:?subject=${subject}&body=${body}`;
    const ok  = await Linking.canOpenURL(url);
    if (ok) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Помилка", "Поштовий клієнт не знайдено.");
    }
  }

  const counts: Record<string, number> = {
    inventory: labInventory.length, equipment: labEquipment.length,
    glp: diaryEntries.length, waste: wasteRecords.length, experiments: labExperiments.length,
  };

  return (
    <View style={{ gap: 16 }}>
      <View style={s.moduleHeader}>
        <View style={[s.moduleIconWrap, { backgroundColor: "#0284c718" }]}>
          <Icons.FileDown size={20} color="#0284c7" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.moduleTitle}>Звіти лабораторії</Text>
          <Text style={s.moduleSub}>Генерація PDF та відправка через Share API</Text>
        </View>
      </View>

      <View style={s.reportInfoBanner}>
        <Icons.Info size={14} color="#0369a1" strokeWidth={2} />
        <Text style={s.reportInfoText}>
          PDF-файл містить актуальні дані. Після генерації відкриється стандартне меню Share — збережіть або надішліть будь-якому застосунку.
        </Text>
      </View>

      {lastFile && (
        <MotiView from={{ opacity: 0, translateY: -6 }} animate={{ opacity: 1, translateY: 0 }}>
          <View style={s.reportReadyCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.reportReadyTitle}>Готовий файл</Text>
              <Text style={s.reportReadySub}>{lastFile.filename}.pdf</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable onPress={() => shareFile(lastFile.uri, lastFile.filename)} style={[s.reportActionBtn, { backgroundColor: "#0284c7" }]}>
                <Icons.Share2 size={14} color="white" strokeWidth={2.5} />
                <Text style={s.reportActionBtnText}>Share</Text>
              </Pressable>
              <Pressable onPress={() => sendEmail(lastFile)} style={[s.reportActionBtn, { backgroundColor: "#059669" }]}>
                <Icons.Mail size={14} color="white" strokeWidth={2.5} />
                <Text style={s.reportActionBtnText}>Email</Text>
              </Pressable>
            </View>
          </View>
        </MotiView>
      )}

      {REPORT_TYPES.map((rep, i) => {
        const RepIcon      = rep.Icon;
        const count        = counts[rep.id] ?? 0;
        const isGenerating = generating === rep.id;
        return (
          <MotiView key={rep.id} from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 50 }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); generate(rep.id); }}
              disabled={!!generating}
              style={({ pressed }) => [s.reportCard, { borderLeftColor: rep.color }, pressed && { opacity: 0.82 }, !!generating && !isGenerating && { opacity: 0.5 }]}
            >
              <LinearGradient colors={[rep.color + "20", rep.color + "08"]} style={s.reportCardIcon}>
                <RepIcon size={22} color={rep.color} strokeWidth={1.7} />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.reportCardTitle}>{rep.label}</Text>
                <Text style={s.reportCardSub}>{rep.sub}</Text>
                <View style={[s.reportCountBadge, { backgroundColor: rep.color + "15" }]}>
                  <Text style={[s.reportCountText, { color: rep.color }]}>{count} записів</Text>
                </View>
              </View>
              <View style={s.reportBtnWrap}>
                {isGenerating ? (
                  <View style={[s.reportBtn, { backgroundColor: rep.color + "20" }]}>
                    <Icons.Loader size={16} color={rep.color} strokeWidth={2.5} />
                  </View>
                ) : (
                  <View style={[s.reportBtn, { backgroundColor: rep.color }]}>
                    <Icons.Download size={16} color="white" strokeWidth={2.5} />
                  </View>
                )}
              </View>
            </Pressable>
          </MotiView>
        );
      })}

      {/* Zenodo / Open Science */}
      <View style={s.zenodoSection}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Icons.Globe size={15} color="#7c3aed" strokeWidth={2} />
          <Text style={s.zenodoTitle}>Відкрита наука (Zenodo)</Text>
        </View>
        <Text style={s.zenodoDesc}>
          Завантажте DataCite XML-метадані для публікації датасету або SOP-методики на Zenodo — безкоштовному репозиторії CERN.
        </Text>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); generateZenodo(); }}
          disabled={zenodoGenerating}
          style={[s.zenodoBtn, zenodoGenerating && { opacity: 0.6 }]}
        >
          {zenodoGenerating
            ? <Icons.Loader size={15} color="white" strokeWidth={2.5} />
            : <Icons.FileCode size={15} color="white" strokeWidth={2.5} />}
          <Text style={s.zenodoBtnText}>{zenodoGenerating ? "Генерація..." : "Сформувати DataCite XML"}</Text>
        </Pressable>
      </View>

      <View style={s.reportFooter}>
        <Icons.ShieldCheck size={12} color="#64748b" strokeWidth={2} />
        <Text style={s.reportFooterText}>Всі звіти відповідають стандартам GLP/GMP документування</Text>
      </View>
    </View>
  );
}
