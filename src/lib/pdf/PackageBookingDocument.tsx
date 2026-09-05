// src/lib/pdf/PackageBookingDocument.tsx
//
// The combined document — only the sections toggled on for this booking are
// rendered. Same header rules, divider, info cards, notes/summary split,
// payment history and footer as every other booking type.
//
// Voucher = client-facing. Zero pricing, zero bank details. Driver contacts
//   and passenger lists ARE shown (that's what the traveller needs).
// Invoice = internal. Selling only — never buying cost or profit.
//
// Currency: hotel rows are entered in SAR and converted to PKR by the
// booking's exchangeRate, so EVERY figure on this document is in the
// package's own currency (PKR). Nothing here is left in SAR.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import {
  calculateHotelEntryTotals,
  calculateFlightSegmentTotals,
  calculatePackageLineItems,
  sumLineItems,
  calculateFooterTotals,
  sumPayments,
  calculateRemainingBalance,
} from "@/src/lib/pricingCalculations";

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
  exchangeRate: number;
  discount: number;
  vatPercent: number;
  paymentType: string | null;
  paymentStatus: string | null;
  note: string | null;
  vendorName: string | null;
  includeHotels: boolean;
  includeTransports: boolean;
  includeFlights: boolean;
  includeVisas: boolean;
  createdAt: string | Date;
  hotels: any[];
  transportSegments: any[];
  flightSegments: any[];
  visaEntries: any[];
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
  address: string | null;
  branches: string | null;
  licenseNo: string | null;
};

function fmtDate(d: string | Date) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  return `${datePart} (${weekday})`;
}
// Day-of-week matters as much as the date for flights, so it stays — the
// time goes on a second line to keep the column narrow.
function fmtDateTime(d: string | Date) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const timePart = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} (${weekday})\n${timePart}`;
}
function nightsBetween(checkIn: string | Date, checkOut: string | Date) {
  const a = new Date(checkIn).getTime();
  const b = new Date(checkOut).getTime();
  return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
}
function money(n: number, currency: string) {
  return `${currency} ${n.toFixed(2)}`;
}

export function PackageBookingDocument({
  booking,
  agency,
  variant,
  verifyQrDataUri,
}: {
  booking: BookingData;
  agency: AgencyData;
  variant: "invoice" | "voucher";
  verifyQrDataUri?: string | null;
}) {
  const isInvoice = variant === "invoice";
  const accent = agency.primaryColor || "#D2232A";
  const rate = booking.exchangeRate || 1;
  const cur = booking.currency;

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

    // A package has four sections, so each gets its own banner above the
    // per-row title bars — otherwise the reader can't tell where hotels end
    // and flights begin.
    sectionBanner: { backgroundColor: accent, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 3, marginTop: 10, marginBottom: 2 },
    sectionBannerText: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 1.2 },

    entryTitleBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginTop: 6 },
    entryTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.8 },
    table: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 10 },
    tableNoRadius: { border: "1pt solid #E5E1D8", borderTop: "none", marginBottom: 0 },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F1EC" },
    tableRow: { flexDirection: "row", borderTop: "1pt solid #EFEDE7" },
    th: { padding: 6, color: "#5A5A5A", fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
    td: { padding: 6, fontSize: 8 },

    paxBox: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, padding: 8, marginBottom: 10, backgroundColor: "#FAF9F6" },
    paxLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#5A5A5A", textTransform: "uppercase", marginBottom: 3 },
    paxName: { fontSize: 8, color: "#121212", marginBottom: 1.5 },

    priceRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 8, marginBottom: 16 },
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

  // Only enabled sections contribute, and hotel lines are converted to PKR
  // inside this helper — so grossSelling below is already one currency.
  const lines = calculatePackageLineItems(
    {
      hotels: booking.includeHotels ? booking.hotels : [],
      transportSegments: booking.includeTransports ? booking.transportSegments : [],
      flightSegments: booking.includeFlights ? booking.flightSegments : [],
      visaEntries: booking.includeVisas ? booking.visaEntries : [],
    },
    rate
  );
  const { grossBuying, grossSelling } = sumLineItems(lines);
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: booking.discount,
    vatPercent: booking.vatPercent,
  });

  const totalPaid = sumPayments(booking.payments || []);
  const remainingBalance = calculateRemainingBalance(totals.netTotal, booking.payments || []);

  const hotelTotals = booking.hotels.map((h) => calculateHotelEntryTotals(h));
  const flightTotals = booking.flightSegments.map((f) => calculateFlightSegmentTotals(f));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* Big logo only when one exists — never logo + name together. */}
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
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Currency</Text><Text style={styles.infoValue}>{cur}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Payment Status</Text><Text style={styles.infoValue}>{booking.paymentStatus || "Pending"}</Text></View>
              {isInvoice && (
                <View style={styles.infoLine}><Text style={styles.infoLabel}>Payment Type</Text><Text style={styles.infoValue}>{booking.paymentType || "—"}</Text></View>
              )}
              {isInvoice && booking.vendorName && (
                <View style={styles.infoLine}><Text style={styles.infoLabel}>Vendor</Text><Text style={styles.infoValue}>{booking.vendorName}</Text></View>
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

        {/* ---------------- HOTELS ---------------- */}
        {booking.includeHotels && booking.hotels.length > 0 && (
          <>
            <View style={styles.sectionBanner}>
              <Text style={styles.sectionBannerText}>Accommodation</Text>
            </View>
            {booking.hotels.map((h, i) => (
              <View key={i} wrap={false}>
                <View style={styles.entryTitleBar}>
                  <Text style={styles.entryTitle}>Hotel {i + 1} — {h.city}</Text>
                </View>
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 1.8 }]}>Hotel</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Room Type</Text>
                    <Text style={[styles.th, { flex: 1.3 }]}>Check-in</Text>
                    <Text style={[styles.th, { flex: 1.3 }]}>Check-out</Text>
                    <Text style={[styles.th, { flex: 0.5 }]}>Nights</Text>
                    <Text style={[styles.th, { flex: 0.5 }]}>Rooms</Text>
                    <Text style={[styles.th, { flex: 0.9 }]}>Guests</Text>
                    <Text style={[styles.th, { flex: 0.7 }]}>Meal</Text>
                    {isInvoice ? (
                      <Text style={[styles.th, { flex: 1.1 }]}>Sell Total</Text>
                    ) : (
                      <Text style={[styles.th, { flex: 1.1 }]}>Conf. No.</Text>
                    )}
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.td, { flex: 1.8 }]}>{h.hotelName}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{h.roomType}</Text>
                    <Text style={[styles.td, { flex: 1.3 }]}>{fmtDate(h.checkIn)}</Text>
                    <Text style={[styles.td, { flex: 1.3 }]}>{fmtDate(h.checkOut)}</Text>
                    <Text style={[styles.td, { flex: 0.5 }]}>{nightsBetween(h.checkIn, h.checkOut)}</Text>
                    <Text style={[styles.td, { flex: 0.5 }]}>{h.rooms}</Text>
                    <Text style={[styles.td, { flex: 0.9 }]}>
                      {h.adults}A{h.children ? ` ${h.children}C` : ""}{h.infants ? ` ${h.infants}I` : ""}
                    </Text>
                    <Text style={[styles.td, { flex: 0.7 }]}>{h.mealPlan || "—"}</Text>
                    {isInvoice ? (
                      // Entered in SAR, shown in the package's currency —
                      // no mixed-currency lines anywhere on this document.
                      <Text style={[styles.td, { flex: 1.1 }]}>
                        {money(hotelTotals[i].sellingTotal * rate, cur)}
                      </Text>
                    ) : (
                      <Text style={[styles.td, { flex: 1.1 }]}>{h.confirmationNo || "—"}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ---------------- TRANSPORT ---------------- */}
        {booking.includeTransports && booking.transportSegments.length > 0 && (
          <>
            <View style={styles.sectionBanner}>
              <Text style={styles.sectionBannerText}>Transport</Text>
            </View>
            {booking.transportSegments.map((s, i) => (
              <View key={i} wrap={false}>
                <View style={styles.entryTitleBar}>
                  <Text style={styles.entryTitle}>Transfer {i + 1} — {s.sector}</Text>
                </View>
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 1.3 }]}>Vehicle</Text>
                    <Text style={[styles.th, { flex: 2 }]}>Sector</Text>
                    <Text style={[styles.th, { flex: 1.5 }]}>Pickup Date</Text>
                    <Text style={[styles.th, { flex: 0.9 }]}>Time</Text>
                    <Text style={[styles.th, { flex: 0.5 }]}>Qty</Text>
                    {isInvoice ? (
                      <Text style={[styles.th, { flex: 1.4 }]}>Sell Total</Text>
                    ) : (
                      <Text style={[styles.th, { flex: 1.4 }]}>Driver Contact</Text>
                    )}
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.td, { flex: 1.3 }]}>{s.vehicle}</Text>
                    <Text style={[styles.td, { flex: 2 }]}>{s.sector}</Text>
                    <Text style={[styles.td, { flex: 1.5 }]}>{fmtDate(s.pickupDate)}</Text>
                    <Text style={[styles.td, { flex: 0.9 }]}>{s.pickupTime || "—"}</Text>
                    <Text style={[styles.td, { flex: 0.5 }]}>{s.qty}</Text>
                    {isInvoice ? (
                      <Text style={[styles.td, { flex: 1.4 }]}>{money(s.sellingPrice, cur)}</Text>
                    ) : (
                      <Text style={[styles.td, { flex: 1.4 }]}>{s.driverContact || "To be advised"}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ---------------- FLIGHTS ---------------- */}
        {booking.includeFlights && booking.flightSegments.length > 0 && (
          <>
            <View style={styles.sectionBanner}>
              <Text style={styles.sectionBannerText}>Flights</Text>
            </View>
            {booking.flightSegments.map((s, i) => {
              const names = (s.passengerNames || "").split("\n").map((n: string) => n.trim()).filter(Boolean);
              return (
                <View key={i} wrap={false}>
                  <View style={styles.entryTitleBar}>
                    <Text style={styles.entryTitle}>
                      Flight {i + 1} — {s.departureAirport} to {s.arrivalAirport}
                    </Text>
                  </View>
                  <View style={names.length > 0 ? styles.tableNoRadius : styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.th, { flex: 1.4 }]}>Airline</Text>
                      <Text style={[styles.th, { flex: 0.9 }]}>Flight No.</Text>
                      <Text style={[styles.th, { flex: 0.9 }]}>PNR</Text>
                      <Text style={[styles.th, { flex: 1.7 }]}>Departure</Text>
                      <Text style={[styles.th, { flex: 1.7 }]}>Arrival</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Class</Text>
                      <Text style={[styles.th, { flex: 0.9 }]}>Pax</Text>
                      {isInvoice ? (
                        <Text style={[styles.th, { flex: 1.2 }]}>Sell Total</Text>
                      ) : (
                        <Text style={[styles.th, { flex: 1.2 }]}>Baggage</Text>
                      )}
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { flex: 1.4 }]}>{s.airline}</Text>
                      <Text style={[styles.td, { flex: 0.9 }]}>{s.flightNo}</Text>
                      <Text style={[styles.td, { flex: 0.9 }]}>{s.pnr || "—"}</Text>
                      <Text style={[styles.td, { flex: 1.7 }]}>{fmtDateTime(s.departureDateTime)}</Text>
                      <Text style={[styles.td, { flex: 1.7 }]}>{fmtDateTime(s.arrivalDateTime)}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{s.travelClass || "—"}</Text>
                      <Text style={[styles.td, { flex: 0.9 }]}>
                        {s.adults}A{s.children ? ` ${s.children}C` : ""}{s.infants ? ` ${s.infants}I` : ""}
                      </Text>
                      {isInvoice ? (
                        <Text style={[styles.td, { flex: 1.2 }]}>{money(flightTotals[i].sellingTotal, cur)}</Text>
                      ) : (
                        <Text style={[styles.td, { flex: 1.2 }]}>{s.baggage || "—"}</Text>
                      )}
                    </View>
                  </View>
                  {names.length > 0 && (
                    <View style={styles.paxBox}>
                      <Text style={styles.paxLabel}>Passengers</Text>
                      {names.map((n: string, ni: number) => (
                        <Text key={ni} style={styles.paxName}>{ni + 1}. {n}</Text>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* ---------------- VISAS ---------------- */}
        {booking.includeVisas && booking.visaEntries.length > 0 && (
          <>
            <View style={styles.sectionBanner}>
              <Text style={styles.sectionBannerText}>Visas</Text>
            </View>
            {booking.visaEntries.map((e, i) => (
              <View key={i} wrap={false}>
                <View style={styles.entryTitleBar}>
                  <Text style={styles.entryTitle}>Applicant {i + 1} — {e.visaCategory}</Text>
                </View>
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.th, { flex: 1.7 }]}>Applicant</Text>
                    <Text style={[styles.th, { flex: 1.3 }]}>Passport No.</Text>
                    <Text style={[styles.th, { flex: 1.4 }]}>Company</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Processing</Text>
                    <Text style={[styles.th, { flex: 1.4 }]}>Submission</Text>
                    <Text style={[styles.th, { flex: 1.4 }]}>Expiry</Text>
                    {isInvoice && <Text style={[styles.th, { flex: 1.2 }]}>Sell Total</Text>}
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.td, { flex: 1.7 }]}>{e.applicantName}</Text>
                    <Text style={[styles.td, { flex: 1.3 }]}>{e.passportNumber}</Text>
                    <Text style={[styles.td, { flex: 1.4 }]}>{e.companyName || "—"}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{e.processingType || "—"}</Text>
                    <Text style={[styles.td, { flex: 1.4 }]}>{e.submissionDate ? fmtDate(e.submissionDate) : "—"}</Text>
                    <Text style={[styles.td, { flex: 1.4 }]}>{e.expiryDate ? fmtDate(e.expiryDate) : "—"}</Text>
                    {isInvoice && (
                      <Text style={[styles.td, { flex: 1.2 }]}>{money(e.sellingPrice, cur)}</Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {isInvoice && (
          <View style={styles.priceRow}>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{booking.note || "—"}</Text>
              {booking.includeHotels && rate > 0 && (
                <Text style={[styles.notesText, { marginTop: 6, fontFamily: "Helvetica-Bold" }]}>
                  Hotel rates converted at 1 SAR = {rate} {cur}
                </Text>
              )}
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>Subtotal</Text><Text>{money(grossSelling, cur)}</Text></View>
              {booking.discount > 0 && (
                <View style={styles.summaryLine}><Text style={styles.infoLabel}>Discount</Text><Text>-{money(booking.discount, cur)}</Text></View>
              )}
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>VAT ({booking.vatPercent || 0}%)</Text><Text>{money(totals.taxAmount, cur)}</Text></View>
              <View style={styles.summaryTotalLine}>
                <Text style={styles.summaryTotalLabel}>TOTAL PRICE</Text>
                <Text style={styles.summaryTotalValue}>{money(totals.netTotal, cur)}</Text>
              </View>
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>Total Paid</Text><Text>{money(totalPaid, cur)}</Text></View>
              <View style={styles.summaryTotalLine}>
                <Text style={styles.summaryTotalLabel}>REMAINING BALANCE</Text>
                <Text style={styles.summaryTotalValue}>{money(remainingBalance, cur)}</Text>
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
                <Text style={[styles.th, { flex: 1.4 }]}>Date</Text>
                <Text style={[styles.th, { flex: 1 }]}>Amount</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Method / Account</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Note</Text>
              </View>
              {booking.payments.map((p, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.4 }]}>{fmtDate(p.paidOn)}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{money(p.amount, cur)}</Text>
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
                  <Text style={styles.qrCaption}>Scan to Verify{"\n"}Hajj &amp; Umrah Services</Text>
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

          {agency.address && (
            <Text style={[styles.policyText, { textAlign: "center", marginTop: 10 }]}>{agency.address}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}