const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Order, ConnectedApp } = require('../models');
const logger = require('../utils/logger');

class InvoiceService {
  constructor() {
    this.invoicesDir = path.join(__dirname, '../../invoices');
    this.ensureInvoicesDirectory();
  }

  ensureInvoicesDirectory() {
    if (!fs.existsSync(this.invoicesDir)) {
      fs.mkdirSync(this.invoicesDir, { recursive: true });
    }
  }

  async generateInvoicePDF(orderId) {
    try {
      const order = await Order.findByPk(orderId, {
        include: [{
          model: ConnectedApp,
          as: 'platform',
          attributes: ['app_name']
        }]
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const invoiceFilename = `invoice_${order.platform_order_id}_${Date.now()}.pdf`;
      const invoicePath = path.join(this.invoicesDir, invoiceFilename);

      const doc = new PDFDocument({ margin: 50 });
      doc.pipe(fs.createWriteStream(invoicePath));

      // Header
      doc.fontSize(20).text('INVOICE', 50, 50);
      doc.fontSize(12).text('UniOrder Restaurant Management System', 50, 80);
      
      // Restaurant Info (placeholder - should come from settings)
      doc.text('Restaurant Name: Your Restaurant', 50, 110);
      doc.text('Address: Your Restaurant Address', 50, 125);
      doc.text('Phone: +966 XX XXX XXXX', 50, 140);

      // Invoice Details
      doc.text(`Invoice #: ${order.platform_order_id}`, 350, 110);
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 350, 125);
      doc.text(`Platform: ${order.platform?.app_name || 'Unknown'}`, 350, 140);

      // Customer Info
      doc.text('Bill To:', 50, 180);
      doc.text(`${order.customer_name}`, 50, 195);
      doc.text(`${order.customer_phone}`, 50, 210);
      doc.text(`${order.customer_address}`, 50, 225, { width: 200 });

      // Items Table Header
      const tableTop = 280;
      doc.text('Item', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Price', 300, tableTop);
      doc.text('Total', 400, tableTop);
      
      // Draw line under header
      doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

      // Items
      let yPosition = tableTop + 30;
      let subtotal = 0;

      order.order_items.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        doc.text(item.name, 50, yPosition, { width: 180 });
        doc.text(item.quantity.toString(), 250, yPosition);
        doc.text(`${item.price.toFixed(2)} SAR`, 300, yPosition);
        doc.text(`${itemTotal.toFixed(2)} SAR`, 400, yPosition);

        if (item.notes) {
          yPosition += 15;
          doc.fontSize(10).text(`Note: ${item.notes}`, 70, yPosition, { width: 160 });
          doc.fontSize(12);
        }

        yPosition += 20;
      });

      // Totals
      yPosition += 20;
      doc.moveTo(300, yPosition).lineTo(500, yPosition).stroke();
      yPosition += 10;

      doc.text('Subtotal:', 350, yPosition);
      doc.text(`${subtotal.toFixed(2)} SAR`, 450, yPosition);

      // Tax (if applicable)
      const taxRate = 0.15; // 15% VAT
      const taxAmount = subtotal * taxRate;
      yPosition += 20;
      doc.text('VAT (15%):', 350, yPosition);
      doc.text(`${taxAmount.toFixed(2)} SAR`, 450, yPosition);

      // Total
      yPosition += 20;
      doc.fontSize(14).text('Total:', 350, yPosition);
      doc.text(`${order.total_amount} SAR`, 450, yPosition);

      // Footer
      doc.fontSize(10).text('Thank you for your business!', 50, yPosition + 50);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 50, yPosition + 70);

      doc.end();

      logger.info(`Invoice generated for order ${orderId}: ${invoiceFilename}`);
      
      return {
        filename: invoiceFilename,
        path: invoicePath,
        url: `/api/orders/${orderId}/invoice`
      };

    } catch (error) {
      logger.error(`Failed to generate invoice for order ${orderId}:`, error.message);
      throw error;
    }
  }

  async getInvoicePath(orderId) {
    const files = fs.readdirSync(this.invoicesDir);
    const invoiceFile = files.find(file => file.includes(`invoice_`) && file.includes(orderId.toString()));
    
    if (invoiceFile) {
      return path.join(this.invoicesDir, invoiceFile);
    }
    
    return null;
  }

  async deleteInvoice(orderId) {
    try {
      const invoicePath = await this.getInvoicePath(orderId);
      if (invoicePath && fs.existsSync(invoicePath)) {
        fs.unlinkSync(invoicePath);
        logger.info(`Invoice deleted for order ${orderId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to delete invoice for order ${orderId}:`, error.message);
      throw error;
    }
  }
}

module.exports = new InvoiceService();