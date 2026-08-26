// src/lib/pdf/HotelBookingDocument.tsx
//
// Voucher = client-facing. Shows the TOTAL SELLING PRICE (subtotal/discount/
//   VAT/final total) so the client knows what they owe — but never buying
//   cost or profit, and never a per-hotel price breakdown.
// Invoice = internal/dealer-facing, full pricing (buying + selling + profit).
//
// Hotels are grouped by city into separate titled blocks (e.g. "JEDDAH HOTEL
// DETAILS", "MADINAH HOTEL DETAILS") rather than one flat table, matching the
// reference layout.
//
// agency.primaryColor drives every accent color here — this is already
// per-agency, not hardcoded. Different agency, different color, automatically.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { calculateHotelEntryTotals, sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";

type HotelEntry = {
  hotelName: string;
  city: string;
  roomType: string;
  checkIn: string | Date;
  checkOut: string | Date;
  rooms: number;
  adults: number;
  children: number;
  infants: number;
  mealPlan: string | null;
  confirmationNo: string | null;
  buyingCostPerNight: number;
  sellingPricePerNight: number;
};

type BookingData = {
  id: string;
  agentName: string;
  guestName: string;
  nationality: string;
  mobileNo: string;
  referenceNo: string | null;
  currency: string;
  discount: number;
  vatPercent: number;
  paymentType: string | null;
  paymentStatus: string | null;
  note: string | null;
  createdAt: string | Date;
  hotels: HotelEntry[];
};

type AgencyData = {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNo: string | null;
  bankIban: string | null;
  bankAddress: string | null;
  cancellationPolicy: string | null;
  noShowPolicy: string | null;
  importantContact: string | null;
};

function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

// "30 Jul 2026 (Thu)" — date plus day-of-week, matching the reference.
function fmtDate(d: string | Date) {
  const date = new Date(d);
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  return `${datePart} (${weekday})`;
}

function money(n: number, currency: string) {
  return `${currency} ${n.toFixed(2)}`;
}

export function HotelBookingDocument({
  booking,
  agency,
  variant,
}: {
  booking: BookingData;
  agency: AgencyData;
  variant: "invoice" | "voucher";
}) {
  const isInvoice = variant === "invoice";
  const accent = agency.primaryColor || "#D2232A";

  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#121212" },

    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { width: 100, height: 60, objectFit: "contain" },
    agencyName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
    docTitleBlock: { alignItems: "flex-end" },
    docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, color: accent },
    badgeRow: { flexDirection: "row", gap: 6, marginTop: 8 },
    badge: { backgroundColor: accent, color: "white", paddingVertical: 5, paddingHorizontal: 9, borderRadius: 3, fontSize: 8 },

    dotDivider: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 14, gap: 6 },
    dotLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
    dotMark: { fontSize: 9, color: accent },

    sectionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    infoCard: { flex: 1, border: "1pt solid #E5E1D8", borderRadius: 6, overflow: "hidden" },
    infoCardTitleBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10 },
    infoCardTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.5 },
    infoCardBody: { padding: 10 },
    infoLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    infoLabel: { color: "#6B6B6B" },
    infoValue: { fontFamily: "Helvetica-Bold" },

    cityTitleBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginBottom: 0, marginTop: 6 },
    cityTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.8 },
    table: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 16 },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F1EC" },
    tableRow: { flexDirection: "row", borderTop: "1pt solid #EFEDE7" },
    tableRowAlt: { flexDirection: "row", borderTop: "1pt solid #EFEDE7", backgroundColor: "#FAF9F6" },
    th: { padding: 6, color: "#5A5A5A", fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
    td: { padding: 6, fontSize: 8 },

    summaryBox: { alignSelf: "flex-end", width: 230, border: "1pt solid #E5E1D8", borderRadius: 6, padding: 12, marginBottom: 16 },
    summaryLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    summaryTotalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1pt solid #E5E1D8" },
    summaryTotalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    summaryTotalValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: accent },

    footer: { marginTop: 8, paddingTop: 12, borderTop: "1pt solid #E5E1D8" },
    footerRow: { flexDirection: "row", gap: 24 },
    footerCol: { flex: 1 },
    footerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
    footerText: { fontSize: 7.5, color: "#6B6B6B", marginBottom: 2 },
    policyText: { fontSize: 7, color: "#9A9A9A", marginTop: 2 },
    signOff: { marginTop: 14, alignItems: "flex-end" },
    signOffText: { fontSize: 8, color: "#6B6B6B" },
    signOffName: { fontSize: 9, fontFamily: "Helvetica-Bold", marginTop: 2 },
  });

  // Same functions the Manage page uses — guarantees this can never disagree
  // with what the portal shows.
  const rowTotals = booking.hotels.map((h) => calculateHotelEntryTotals(h));
  const { grossBuying, grossSelling } = sumLineItems(
    rowTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }))
  );
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: booking.discount,
    vatPercent: booking.vatPercent,
  });
  const subtotal = grossSelling - (booking.discount || 0);
  const vatAmount = totals.netTotal - subtotal;

  // Group hotel rows by city into separate titled blocks, matching the reference.
  const cityGroups: { city: string; rows: { entry: HotelEntry; totals: { buyingTotal: number; sellingTotal: number } }[] }[] = [];
  booking.hotels.forEach((h, i) => {
    let group = cityGroups.find((g) => g.city === h.city);
    if (!group) {
      group = { city: h.city, rows: [] };
      cityGroups.push(group);
    }
    group.rows.push({ entry: h, totals: rowTotals[i] });
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            {agency.logoUrl && <Image src={agency.logoUrl} style={styles.logo} />}
            <Text style={styles.agencyName}>{agency.name}</Text>
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>{isInvoice ? "INVOICE" : "VOUCHER"}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>REF {booking.referenceNo || booking.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.badge}>{fmtDate(booking.createdAt)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.dotDivider}>
          <View style={styles.dotLine} />
          <Text style={styles.dotMark}>✕</Text>
          <View style={styles.dotLine} />
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardTitleBar}>
              <Text style={styles.infoCardTitle}>Booking Information</Text>
            </View>
            <View style={styles.infoCardBody}>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Agent</Text><Text style={styles.infoValue}>{booking.agentName}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Reference No.</Text><Text style={styles.infoValue}>{booking.referenceNo || "—"}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Currency</Text><Text style={styles.infoValue}>{booking.currency}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Payment Status</Text><Text style={styles.infoValue}>{booking.paymentStatus || "Pending"}</Text></View>
              {isInvoice && (
                <View style={styles.infoLine}><Text style={styles.infoLabel}>Payment Type</Text><Text style={styles.infoValue}>{booking.paymentType || "—"}</Text></View>
              )}
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoCardTitleBar}>
              <Text style={styles.infoCardTitle}>Guest Information</Text>
            </View>
            <View style={styles.infoCardBody}>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Guest Name</Text><Text style={styles.infoValue}>{booking.guestName}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Nationality</Text><Text style={styles.infoValue}>{booking.nationality}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Mobile No.</Text><Text style={styles.infoValue}>{booking.mobileNo}</Text></View>
            </View>
          </View>
        </View>

        {cityGroups.map((group, gi) => (
          <View key={gi} wrap={false}>
            <View style={styles.cityTitleBar}>
              <Text style={styles.cityTitle}>{group.city} Hotel Details</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 2 }]}>Hotel</Text>
                <Text style={[styles.th, { flex: 1 }]}>Room Type</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Check-in</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Check-out</Text>
                <Text style={[styles.th, { flex: 0.6 }]}>Nights</Text>
                <Text style={[styles.th, { flex: 0.6 }]}>Rooms</Text>
                <Text style={[styles.th, { flex: 1 }]}>Guests</Text>
                <Text style={[styles.th, { flex: 0.8 }]}>Meal</Text>
                {isInvoice ? (
                  <>
                    <Text style={[styles.th, { flex: 1 }]}>Buy Total</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Sell Total</Text>
                  </>
                ) : (
                  <Text style={[styles.th, { flex: 1 }]}>Conf. No.</Text>
                )}
              </View>
              {group.rows.map((row, i) => (
                <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.td, { flex: 2 }]}>{row.entry.hotelName}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{row.entry.roomType}</Text>
                  <Text style={[styles.td, { flex: 1.3 }]}>{fmtDate(row.entry.checkIn)}</Text>
                  <Text style={[styles.td, { flex: 1.3 }]}>{fmtDate(row.entry.checkOut)}</Text>
                  <Text style={[styles.td, { flex: 0.6 }]}>{nightsBetween(row.entry.checkIn, row.entry.checkOut)}</Text>
                  <Text style={[styles.td, { flex: 0.6 }]}>{row.entry.rooms}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {row.entry.adults}A{row.entry.children ? ` ${row.entry.children}C` : ""}{row.entry.infants ? ` ${row.entry.infants}I` : ""}
                  </Text>
                  <Text style={[styles.td, { flex: 0.8 }]}>{row.entry.mealPlan || "—"}</Text>
                  {isInvoice ? (
                    <>
                      <Text style={[styles.td, { flex: 1 }]}>{money(row.totals.buyingTotal, booking.currency)}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{money(row.totals.sellingTotal, booking.currency)}</Text>
                    </>
                  ) : (
                    <Text style={[styles.td, { flex: 1 }]}>{row.entry.confirmationNo || "—"}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Voucher shows the total selling price (what the client owes) but
            never buying cost or profit — those stay invoice-only. */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryLine}><Text style={styles.infoLabel}>Subtotal</Text><Text>{money(grossSelling, booking.currency)}</Text></View>
          {booking.discount > 0 && (
            <View style={styles.summaryLine}><Text style={styles.infoLabel}>Discount</Text><Text>-{money(booking.discount, booking.currency)}</Text></View>
          )}
          <View style={styles.summaryLine}><Text style={styles.infoLabel}>VAT ({booking.vatPercent || 0}%)</Text><Text>{money(vatAmount, booking.currency)}</Text></View>
          {isInvoice && (
            <View style={styles.summaryLine}><Text style={styles.infoLabel}>Net Profit</Text><Text>{money(totals.profit, booking.currency)}</Text></View>
          )}
          <View style={styles.summaryTotalLine}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalValue}>{money(totals.netTotal, booking.currency)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {isInvoice ? (
            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Text style={styles.footerTitle}>Bank Details</Text>
                {agency.bankAccountName && <Text style={styles.footerText}>Account Name: {agency.bankAccountName}</Text>}
                {agency.bankName && <Text style={styles.footerText}>Bank: {agency.bankName}</Text>}
                {agency.bankAccountNo && <Text style={styles.footerText}>Account No: {agency.bankAccountNo}</Text>}
                {agency.bankIban && <Text style={styles.footerText}>IBAN: {agency.bankIban}</Text>}
              </View>
              <View style={styles.footerCol}>
                <Text style={styles.footerTitle}>Contact</Text>
                {agency.importantContact && <Text style={styles.footerText}>{agency.importantContact}</Text>}
                {booking.note && <Text style={styles.footerText}>Note: {booking.note}</Text>}
              </View>
            </View>
          ) : (
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Contact</Text>
              {agency.importantContact && <Text style={styles.footerText}>{agency.importantContact}</Text>}
            </View>
          )}

          {agency.cancellationPolicy && <Text style={styles.policyText}>Cancellation Policy: {agency.cancellationPolicy}</Text>}
          {agency.noShowPolicy && <Text style={styles.policyText}>No-Show Policy: {agency.noShowPolicy}</Text>}

          <View style={styles.signOff}>
            <Text style={styles.signOffText}>Dear {booking.guestName},</Text>
            <Text style={styles.signOffText}>Thank you for choosing us — we look forward to serving you.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}