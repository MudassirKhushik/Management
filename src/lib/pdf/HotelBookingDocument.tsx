// src/lib/pdf/HotelBookingDocument.tsx
//
// Voucher = client-facing, carried through the airport. Zero pricing, zero
//   bank details. Shows Makkah/Madinah/Hotline contacts + a QR code linking
//   to a public verification page (Item 7).
// Invoice = internal/payment document. Shows SELLING price only per hotel
//   (rate/night -> total) — never buying cost or profit (Item 9). Includes
//   bank details, Payment History, Total Paid / Remaining Balance, and a
//   Notes + Exchange-Rate-Note box placed beside the price summary (Item 10).
//
// Hotels are listed in the order they were entered — "Hotel 1", "Hotel 2",
// "Hotel 3" — not grouped/re-ordered by city (Items 5 & 8).
//
// agency.primaryColor drives every accent color here — already per-agency.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import {
  calculateHotelEntryTotals,
  sumLineItems,
  calculateFooterTotals,
  sumPayments,
  calculateRemainingBalance,
} from "@/src/lib/pricingCalculations";

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
  adultBuyingPricePerNight: number;
  adultSellingPricePerNight: number;
  childBuyingPricePerNight: number;
  childSellingPricePerNight: number;
};

type PaymentEntry = {
  amount: number;
  paidOn: string | Date;
  note: string | null;
  bankAccount: { accountName: string | null; bankName: string | null } | null;
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
  exchangeRate: number; // Item 5 (round 3) — required, e.g. 1 SAR = 75 PKR
  createdAt: string | Date;
  hotels: HotelEntry[];
  payments: PaymentEntry[];
};

type AgencyData = {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  bankAccounts: {
    accountName: string | null;
    bankName: string | null;
    accountNo: string | null;
    iban: string | null;
    address: string | null;
  }[];
  cancellationPolicy: string | null;
  noShowPolicy: string | null;
  makkahContact: string | null;
  madinahContact: string | null;
  hotlineContact: string | null;
  // Round 4 — Agency Info
  address: string | null;
  branches: string | null;
  licenseNo: string | null;
};

function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

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
  verifyQrDataUri, // Item 7 — generated server-side in the PDF route, voucher-only
}: {
  booking: BookingData;
  agency: AgencyData;
  variant: "invoice" | "voucher";
  verifyQrDataUri?: string | null;
}) {
  const isInvoice = variant === "invoice";
  const accent = agency.primaryColor || "#D2232A";

  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#121212" },

    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
    logoRow: { flexDirection: "column" },
    logoBig: { width: 155, height: 88, objectFit: "contain" },
    agencyNameFallback: { fontSize: 19, fontFamily: "Helvetica-Bold" },
    branchesText: { fontSize: 6.5, color: "#9A9A9A", marginTop: 4, maxWidth: 220 },
    docTitleBlock: { alignItems: "flex-end" },
    docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, color: accent },
    badgeRow: { flexDirection: "row", gap: 6, marginTop: 8 },
    badge: { backgroundColor: accent, color: "white", paddingVertical: 5, paddingHorizontal: 9, borderRadius: 3, fontSize: 8 },
    licenseText: { fontSize: 6.5, color: "#9A9A9A", marginTop: 4 },

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

    hotelTitleBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginBottom: 0, marginTop: 6 },
    hotelTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.8 },
    table: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 16 },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F1EC" },
    tableRow: { flexDirection: "row", borderTop: "1pt solid #EFEDE7" },
    th: { padding: 6, color: "#5A5A5A", fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
    td: { padding: 6, fontSize: 8 },

    priceRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 16 },
    notesBox: { flex: 1, border: "1pt solid #E5E1D8", borderRadius: 6, padding: 12 },
    notesTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
    notesText: { fontSize: 8, color: "#6B6B6B", marginBottom: 3, lineHeight: 1.4 },

    summaryBox: { width: 230, border: "1pt solid #E5E1D8", borderRadius: 6, padding: 12 },
    summaryLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    summaryTotalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1pt solid #E5E1D8" },
    summaryTotalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    summaryTotalValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: accent },

    paymentHistoryBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginTop: 6 },
    paymentHistoryTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.8 },
    paymentTable: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 16 },

    footer: { marginTop: 8, paddingTop: 12, borderTop: "1pt solid #E5E1D8" },
    footerRow: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
    footerCol: { flex: 1 },
    footerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
    footerText: { fontSize: 7.5, color: "#6B6B6B", marginBottom: 2 },
    policyText: { fontSize: 7, color: "#9A9A9A", marginTop: 2 },
    signOff: { marginTop: 14, alignItems: "flex-end" },
    signOffText: { fontSize: 8, color: "#6B6B6B" },

    qrBlock: { alignItems: "center" },
    qrImage: { width: 70, height: 70 },
    qrCaption: { fontSize: 6.5, color: "#9A9A9A", marginTop: 3, textAlign: "center" },
  });

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

  const totalPaid = sumPayments(booking.payments || []);
  const remainingBalance = calculateRemainingBalance(totals.netTotal, booking.payments || []);
  const convertedNetTotal = totals.netTotal * (booking.exchangeRate || 0);
  const hasNotes = Boolean(booking.note);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* Item 3 (round 4, confirmed): ONLY the big logo when one exists
              — no name alongside it. Falls back to just the name (large)
              when there's no logo. Branches list sits underneath either way. */}
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
            <Text style={styles.docTitle}>{isInvoice ? "INVOICE" : "VOUCHER"}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>REF {booking.referenceNo || booking.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.badge}>{fmtDate(booking.createdAt)}</Text>
            </View>
            {agency.licenseNo && <Text style={styles.licenseText}>License No: {agency.licenseNo}</Text>}
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

        {/* Items 5 & 8: hotels listed in entry order — "Hotel 1", "Hotel 2",
            "Hotel 3" — never grouped/reordered by city. */}
        {booking.hotels.map((h, i) => (
          <View key={i} wrap={false}>
            <View style={styles.hotelTitleBar}>
              <Text style={styles.hotelTitle}>Hotel {i + 1} — {h.city}</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.8 }]}>Hotel</Text>
                <Text style={[styles.th, { flex: 1 }]}>Room Type</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Check-in</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Check-out</Text>
                <Text style={[styles.th, { flex: 0.5 }]}>Nights</Text>
                <Text style={[styles.th, { flex: 0.5 }]}>Rooms</Text>
                <Text style={[styles.th, { flex: 0.9 }]}>Guests</Text>
                <Text style={[styles.th, { flex: 0.7 }]}>Meal</Text>
                {isInvoice ? (
                  <>
                    <Text style={[styles.th, { flex: 1.1 }]}>Rate / Night</Text>
                    <Text style={[styles.th, { flex: 0.9 }]}>Sell Total</Text>
                  </>
                ) : (
                  <Text style={[styles.th, { flex: 1 }]}>Conf. No.</Text>
                )}
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.td, { flex: 1.8 }]}>{h.hotelName}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{h.roomType}</Text>
                <Text style={[styles.td, { flex: 1.2 }]}>{fmtDate(h.checkIn)}</Text>
                <Text style={[styles.td, { flex: 1.2 }]}>{fmtDate(h.checkOut)}</Text>
                <Text style={[styles.td, { flex: 0.5 }]}>{nightsBetween(h.checkIn, h.checkOut)}</Text>
                <Text style={[styles.td, { flex: 0.5 }]}>{h.rooms}</Text>
                <Text style={[styles.td, { flex: 0.9 }]}>
                  {h.adults}A{h.children ? ` ${h.children}C` : ""}{h.infants ? ` ${h.infants}I` : ""}
                </Text>
                <Text style={[styles.td, { flex: 0.7 }]}>{h.mealPlan || "—"}</Text>
                {isInvoice ? (
                  <>
                    {/* Item 9: SELLING rate/total only — never buying cost or profit */}
                    <Text style={[styles.td, { flex: 1.1 }]}>
                      A: {money(h.adultSellingPricePerNight, booking.currency)}
                      {h.children > 0 ? ` / C: ${money(h.childSellingPricePerNight, booking.currency)}` : ""}
                    </Text>
                    <Text style={[styles.td, { flex: 0.9 }]}>{money(rowTotals[i].sellingTotal, booking.currency)}</Text>
                  </>
                ) : (
                  <Text style={[styles.td, { flex: 1 }]}>{h.confirmationNo || "—"}</Text>
                )}
              </View>
            </View>
          </View>
        ))}

        {/* Item 10: Notes (+ Exchange Rate Note, Item 6) sit beside the price
            summary box instead of the empty space next to it going to waste.
            Invoice only — matches where the old summary box used to be. */}
        {isInvoice && (
          <View style={styles.priceRow}>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notes</Text>
              {booking.note && <Text style={styles.notesText}>{booking.note}</Text>}
              {!hasNotes && <Text style={styles.notesText}>—</Text>}
              {booking.exchangeRate > 0 && (
                <>
                  <Text style={[styles.notesText, { marginTop: 6, fontFamily: "Helvetica-Bold" }]}>
                    Exchange Rate: 1 {booking.currency} = {booking.exchangeRate} PKR
                  </Text>
                  <Text style={styles.notesText}>Converted Revenue: PKR {convertedNetTotal.toFixed(2)}</Text>
                </>
              )}
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>Subtotal</Text><Text>{money(grossSelling, booking.currency)}</Text></View>
              {booking.discount > 0 && (
                <View style={styles.summaryLine}><Text style={styles.infoLabel}>Discount</Text><Text>-{money(booking.discount, booking.currency)}</Text></View>
              )}
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>VAT ({booking.vatPercent || 0}%)</Text><Text>{money(totals.taxAmount, booking.currency)}</Text></View>
              <View style={styles.summaryTotalLine}>
                <Text style={styles.summaryTotalLabel}>TOTAL PRICE</Text>
                <Text style={styles.summaryTotalValue}>{money(totals.netTotal, booking.currency)}</Text>
              </View>
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>Total Paid</Text><Text>{money(totalPaid, booking.currency)}</Text></View>
              <View style={styles.summaryTotalLine}>
                <Text style={styles.summaryTotalLabel}>REMAINING BALANCE</Text>
                <Text style={styles.summaryTotalValue}>{money(remainingBalance, booking.currency)}</Text>
              </View>
            </View>
          </View>
        )}

        {isInvoice && booking.payments && booking.payments.length > 0 && (
          <View wrap={false}>
            <View style={styles.paymentHistoryBar}>
              <Text style={styles.paymentHistoryTitle}>Payment History</Text>
            </View>
            <View style={styles.paymentTable}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
                <Text style={[styles.th, { flex: 1 }]}>Amount</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Method / Account</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Note</Text>
              </View>
              {booking.payments.map((p, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.2 }]}>{fmtDate(p.paidOn)}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{money(p.amount, booking.currency)}</Text>
                  <Text style={[styles.td, { flex: 1.6 }]}>
                    {p.bankAccount ? `${p.bankAccount.bankName || p.bankAccount.accountName} (Bank Transfer)` : "Cash"}
                  </Text>
                  <Text style={[styles.td, { flex: 1.6 }]}>{p.note || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {isInvoice ? (
            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Text style={styles.footerTitle}>Bank Details</Text>
                {agency.bankAccounts.length === 0 && <Text style={styles.footerText}>—</Text>}
                {agency.bankAccounts.map((acc, i) => (
                  <View key={i} style={{ marginBottom: i < agency.bankAccounts.length - 1 ? 6 : 0 }}>
                    {agency.bankAccounts.length > 1 && (
                      <Text style={[styles.footerText, { fontFamily: "Helvetica-Bold" }]}>Account {i + 1}</Text>
                    )}
                    {acc.accountName && <Text style={styles.footerText}>Account Name: {acc.accountName}</Text>}
                    {acc.bankName && <Text style={styles.footerText}>Bank: {acc.bankName}</Text>}
                    {acc.accountNo && <Text style={styles.footerText}>Account No: {acc.accountNo}</Text>}
                    {acc.iban && <Text style={styles.footerText}>IBAN: {acc.iban}</Text>}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            // Item 7: Makkah/Madinah/Hotline + QR code side by side
            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Text style={styles.footerTitle}>Contact</Text>
                {agency.makkahContact && <Text style={styles.footerText}>Makkah: {agency.makkahContact}</Text>}
                {agency.madinahContact && <Text style={styles.footerText}>Madinah: {agency.madinahContact}</Text>}
                {agency.hotlineContact && <Text style={styles.footerText}>Hotline: {agency.hotlineContact}</Text>}
              </View>
              {verifyQrDataUri && (
                <View style={styles.qrBlock}>
                  <Image src={verifyQrDataUri} style={styles.qrImage} />
                  <Text style={styles.qrCaption}>Scan to Verify{"\n"}Hajj & Umrah Services</Text>
                </View>
              )}
            </View>
          )}

          {agency.cancellationPolicy && <Text style={styles.policyText}>Cancellation Policy: {agency.cancellationPolicy}</Text>}
          {agency.noShowPolicy && <Text style={styles.policyText}>No-Show Policy: {agency.noShowPolicy}</Text>}

          <View style={styles.signOff}>
            <Text style={styles.signOffText}>Dear {booking.guestName},</Text>
            <Text style={styles.signOffText}>Thank you for choosing us — we look forward to serving you.</Text>
          </View>

          {/* Round 4: Address at the very bottom of the page, as requested */}
          {agency.address && (
            <Text style={[styles.policyText, { textAlign: "center", marginTop: 10 }]}>{agency.address}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}