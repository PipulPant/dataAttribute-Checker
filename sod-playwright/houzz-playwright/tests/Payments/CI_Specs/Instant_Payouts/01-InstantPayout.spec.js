// @ts-nocheck
const { ENVIRONMENT, MIN_LOADING_TIME } = require("../../../../base/envHelper");
const { PAGE_URL } = require("../../../../fixtures/PageUrl");
const { test } = require("../../../../pages/pageObjectManager");
const { auditCurrentPage } = require("playwright-attr-audit");

test.describe(
  "Online Payment - Estimate-GC",
  {
    tag: [
      "@sanity-testing",
      "@regression",
      "@package-update",
      "@gc-spec",
      "@id-spec",
      "@ivy-payments",
      "@ivy-services",
    ],
  },
  () => {
    if (ENVIRONMENT == "prod") return;

    test("01-should allow pro's to click Instant Payout in the landing page", async ({ PaymentPage, page }) => {
      await PaymentPage.visitURL(PAGE_URL.HOMEPAGE);
      
      // Audit page for missing test attributes
      // Enable screenshots and toggle feature to see both missing and existing attributes
      await auditCurrentPage(page, 'Instant-Payout-Homepage', {
        logToConsole: false,
        outputPath: 'test-results/instant-payout-homepage-audit.html',
        captureScreenshots: true, // 📸 Enable screenshots in HTML report
        includeElementsWithAttribute: true, // 🔄 Show elements with attributes too (enables toggle)
        attributeName: 'data-testID', // ⚙️ Customize attribute name if needed
      });
      
      const isInstantPayoutVisible = await PaymentPage.validateInstantPayoutBanner();
      const isPayoutVisible = await PaymentPage.clickPayOutNowBtn();
      if (!isInstantPayoutVisible || !isPayoutVisible) {
        test.skip(true, "Skipping Test as Instant Payout is not visible");
      }
      await PaymentPage.waitForTime(MIN_LOADING_TIME);
      await PaymentPage.validateInstantPayoutTransferModal();
      
      // Audit the transfer modal page
      await auditCurrentPage(page, 'Instant-Payout-Transfer-Modal', {
        logToConsole: false,
        outputPath: 'test-results/instant-payout-transfer-modal-audit.html'
      });
      
      const totalTransferAmount = await PaymentPage.getTotalTransferAmount();
      const userTransferAmount = await PaymentPage.enterTransferAmount(totalTransferAmount);
      await PaymentPage.validateTransferAmount(userTransferAmount);
      await PaymentPage.clickTransferAmountBtn();
      await PaymentPage.validateInstantPayoutConfirmationModal();
      
      // Audit the confirmation modal page
      await auditCurrentPage(page, 'Instant-Payout-Confirmation-Modal', {
        logToConsole: false,
        outputPath: 'test-results/instant-payout-confirmation-modal-audit.html'
      });
    });

    test("02-should allow pro's to click Instant Payout in the Reports page", async ({ PaymentPage, page }) => {
      await PaymentPage.visitURL(PAGE_URL.REPORTS.PAYMENTS_REPORT);
      
      // Audit the reports page
      await auditCurrentPage(page, 'Instant-Payout-Reports-Page', {
        logToConsole: false,
        outputPath: 'test-results/instant-payout-reports-page-audit.html'
      });
      
      const isInstantPayoutVisible = await PaymentPage.validateInstantPayoutBanner();
      const isPayoutVisible = await PaymentPage.clickPayOutNowBtn();
      if (!isInstantPayoutVisible || !isPayoutVisible) {
        test.skip(true, "Skipping Test as Instant Payout is not visible");
      }
      await PaymentPage.waitForTime(MIN_LOADING_TIME);
      await PaymentPage.validateInstantPayoutTransferModal();
      const totalTransferAmount = await PaymentPage.getTotalTransferAmount();
      const userTransferAmount = await PaymentPage.enterTransferAmount(totalTransferAmount);
      await PaymentPage.validateTransferAmount(userTransferAmount);
      await PaymentPage.clickTransferAmountBtn();
      await PaymentPage.validateInstantPayoutConfirmationModal();
    });

    test("03-should allow pro's to view Report for Instant Payout in the Reports page", async ({ PaymentPage, page }) => {
      await PaymentPage.visitURL(PAGE_URL.HOMEPAGE);
      
      // Audit the homepage before clicking view report
      await auditCurrentPage(page, 'Instant-Payout-View-Report-Homepage', {
        logToConsole: false,
        outputPath: 'test-results/instant-payout-view-report-homepage-audit.html'
      });
      
      const isViewReportBtnVisible = await PaymentPage.clickViewReportBtn();
      if (!isViewReportBtnVisible) {
        test.skip(true, "Skipping Test as View Report button is not visible");
      }
      await PaymentPage.validatePayoutReportPage();
      
      // Audit the payout report page
      await auditCurrentPage(page, 'Instant-Payout-Report-Page', {
        logToConsole: false,
        outputPath: 'test-results/instant-payout-report-page-audit.html'
      });
    });
  }
);
