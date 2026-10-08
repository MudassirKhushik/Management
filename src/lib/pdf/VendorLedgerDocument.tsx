// src/lib/pdf/VendorLedgerDocument.tsx
//
// Printable vendor statement — chronological, every total in PKR. A hotel
// purchase line additionally shows the original SAR amount and the exchange
// rate used on that booking, so the PKR figure is never a mystery number.
// Transport/Flight/Visa lines are already PKR — the SAR and Rate columns
// just show "—" for them. Never shown to clients.
//
// Sizing matches the enlarged Voucher/Invoice documents.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { VendorLedgerEntry } from "@/src/lib/vendorHelpers";

type VendorData = {
  name: string;
  vendorCode: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
};

type AgencyData = {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  branches: string | null;
  licenseNo: string | null;
  address: string | null;
};

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function pkr(n: number) {
  return `PKR ${n.toFixed(2)}`;
}

export function VendorLedgerDocument({
  vendor,
  agency,
  entries,
  totalBought,
  totalPaid,
  ledgerNumber,
}: {
  vendor: VendorData;
  agency: AgencyData;
  entries: VendorLedgerEntry[];
  totalBought: number; // PKR
  totalPaid: number; // PKR
  ledgerNumber: string;
}) {
  const accent = agency.primaryColor || "#D2232A";
  const remaining = totalBought - totalPaid;

  const styles = StyleSheet.create({
    page: { padding: 34, fontSize: 10, fontFamily: "Helvetica", color: "#121212" },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
    logoRow: { flexDirection: "column" },
    logoBig: { width: 190, height: 106, objectFit: "contain" },
    agencyNameFallback: { fontSize: 24, fontFamily: "Helvetica-Bold" },
    branchesText: { fontSize: 8, color: "#9A9A9A", marginTop: 6, maxWidth: 260 },
    docTitleBlock: { alignItems: "flex-end" },
    docTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", letterSpacing: 2, color: accent },
    badgeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    badge: { backgroundColor: accent, color: "white", paddingVertical: 7, paddingHorizontal: 13, borderRadius: 4, fontSize: 9.5 },
    licenseText: { fontSize: 8, color: "#9A9A9A", marginTop: 6 },
    dotDivider: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 16, gap: 8 },
    dotLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
    dotMark: { fontSize: 11, color: accent },
    infoCard: { border: "1pt solid #E5E1D8", borderRadius: 8, overflow: "hidden", marginBottom: 16 },
    infoCardTitleBar: { backgroundColor: accent, paddingVertical: 8, paddingHorizontal: 13 },
    infoCardTitle: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.6 },
    infoCardBody: { padding: 13, flexDirection: "row", justifyContent: "space-between" },
    infoLine: { flexDirection: "row", gap: 6, marginBottom: 4 },
    infoLabel: { color: "#6B6B6B", fontSize: 10 },
    infoValue: { fontFamily: "Helvetica-Bold", fontSize: 10.5 },
    currencyNote: { fontSize: 8, color: "#9A9A9A", marginBottom: 10, textAlign: "center" },
    table: { border: "1pt solid #E5E1D8", borderRadius: 5, marginBottom: 16 },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F1EC" },
    tableRow: { flexDirection: "row", borderTop: "1pt solid #EFEDE7" },
    th: { padding: 6, color: "#5A5A5A", fontFamily: "Helvetica-Bold", fontSize: 7.5, textTransform: "uppercase" },
    td: { padding: 6, fontSize: 8.5 },
    tdMuted: { padding: 6, fontSize: 8.5, color: "#B0AEA8" },
    summaryBox: { width: 290, border: "1pt solid #E5E1D8", borderRadius: 8, padding: 16, marginLeft: "auto" },
    summaryLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
    summaryTotalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1pt solid #E5E1D8" },
    summaryTotalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12 },
    summaryTotalValue: { fontFamily: "Helvetica-Bold", fontSize: 13, color: accent },
    footer: { marginTop: 22, paddingTop: 12, borderTop: "1pt solid #E5E1D8" },
    policyText: { fontSize: 8.5, color: "#9A9A9A", textAlign: "center" },
  });

  let running = 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            {agency.logoUrl ? (
              <Image src={agency.logoUrl} style={styles.logoBig} />
            ) : (
              <Text style={styles.agencyNameFallback}>{agency.name}</Text>
            )}
            {agency.branches && (
              <Text style={styles.branchesText}>{agency.branches.split("\n").filter(Boolean).join("  •  ")}</Text>
            )}
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>LEDGER</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>{ledgerNumber}</Text>
              <Text style={styles.badge}>{fmtDate(new Date())}</Text>
            </View>
            {agency.licenseNo && <Text style={styles.licenseText}>License No: {agency.licenseNo}</Text>}
          </View>
        </View>

        <View style={styles.dotDivider}>
          <View style={styles.dotLine} />
          <Text style={styles.dotMark}>✕</Text>
          <View style={styles.dotLine} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardTitleBar}>
            <Text style={styles.infoCardTitle}>Vendor</Text>
          </View>
          <View style={styles.infoCardBody}>
            <View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Name:</Text><Text style={styles.infoValue}>{vendor.name}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Vendor ID:</Text><Text style={styles.infoValue}>{vendor.vendorCode || "—"}</Text></View>
            </View>
            <View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Country:</Text><Text style={styles.infoValue}>{vendor.country || "—"}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Phone:</Text><Text style={styles.infoValue}>{vendor.phone || "—"}</Text></View>
            </View>
          </View>
        </View>

        <Text style={styles.currencyNote}>
          All totals are in PKR. Hotel lines show the original SAR amount and the exchange rate used on that booking.
        </Text>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { flex: 0.95 }]}>Date</Text>
            <Text style={[styles.th, { flex: 2 }]}>Description</Text>
            <Text style={[styles.th, { flex: 0.95 }]}>SAR Amt</Text>
            <Text style={[styles.th, { flex: 0.6 }]}>Rate</Text>
            <Text style={[styles.th, { flex: 1.05 }]}>Bought (PKR)</Text>
            <Text style={[styles.th, { flex: 0.95 }]}>Paid (PKR)</Text>
            <Text style={[styles.th, { flex: 1.05 }]}>Balance (PKR)</Text>
          </View>
          {entries.map((e, i) => {
            if (e.type === "purchase") running += e.amount;
            else running -= e.amount;
            const isHotel = e.type === "purchase" && e.bookingType === "hotel";
            return (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.td, { flex: 0.95 }]}>{fmtDate(e.date)}</Text>
                <Text style={[styles.td, { flex: 2 }]}>
                  {e.type === "purchase" ? `${e.bookingType.toUpperCase()} — ${e.label}` : `Payment${e.note ? ` — ${e.note}` : ""}`}
                </Text>
                <Text style={[isHotel ? styles.td : styles.tdMuted, { flex: 0.95 }]}>
                  {isHotel && e.originalAmount != null ? e.originalAmount.toFixed(2) : "—"}
                </Text>
                <Text style={[isHotel ? styles.td : styles.tdMuted, { flex: 0.6 }]}>
                  {isHotel && e.exchangeRate != null ? e.exchangeRate.toFixed(2) : "—"}
                </Text>
                <Text style={[styles.td, { flex: 1.05 }]}>{e.type === "purchase" ? e.amount.toFixed(2) : "—"}</Text>
                <Text style={[styles.td, { flex: 0.95 }]}>{e.type === "payment" ? e.amount.toFixed(2) : "—"}</Text>
                <Text style={[styles.td, { flex: 1.05 }]}>{running.toFixed(2)}</Text>
              </View>
            );
          })}
          {entries.length === 0 && (
            <View style={styles.tableRow}>
              <Text style={[styles.td, { flex: 7, textAlign: "center", color: "#9A9A9A" }]}>No transactions yet.</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryLine}><Text style={styles.infoLabel}>Total Bought (PKR)</Text><Text>{pkr(totalBought)}</Text></View>
          <View style={styles.summaryLine}><Text style={styles.infoLabel}>Total Paid (PKR)</Text><Text>{pkr(totalPaid)}</Text></View>
          <View style={styles.summaryTotalLine}>
            <Text style={styles.summaryTotalLabel}>{remaining >= 0 ? "REMAINING (TO PAY)" : "OVERPAID (TO RECEIVE)"}</Text>
            <Text style={styles.summaryTotalValue}>{pkr(Math.abs(remaining))}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {agency.address && <Text style={styles.policyText}>{agency.address}</Text>}
        </View>
      </Page>
    </Document>
  );
}
