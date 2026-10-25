'use client';

import { useState, useEffect, useRef } from 'react';
// تم تصحيح المسار هنا بإضافة نقطة واحدة لأن الملف في نفس المجلد
import { supabase } from './supabaseClient';

type Category = { id: string; name: string; isArchived?: boolean };
type Product = {
  id: string;
  categoryId: string;
  name: string;
  isArchived?: boolean;
};
type Batch = {
  id: string;
  productId: string;
  invoiceId?: string;
  x: string;
  w: string;
  y: string;
  z: string;
  q: string;
  t: string;
  previousRemaining: string;
  isExcluded: boolean;
};
type CashType = { id: string; name: string; direction: 'in' | 'out' };
type CashRecord = {
  id: string;
  typeId: string;
  typeName: string;
  direction: 'in' | 'out';
  amount: string;
  date: string;
  note: string;
  isArchived?: boolean;
};

type InvoiceItem = {
  id: string;
  name: string;
  categoryId: string;
  newCategoryName: string;
  x: string;
  w: string;
  y: string;
  z: string;
  q: string;
  t: string;
};

type Invoice = {
  id: string;
  supplierName: string;
  supplierPhone: string;
  date: string;
  totalAmount: number;
  items: InvoiceItem[];
  isArchived?: boolean;
};

type ArchiveBatch = {
  id: string;
  title: string;
  archiveDate: string;
  invoices: Invoice[];
  cashRecords: CashRecord[];
};

type AuditLog = { id: string; time: string; action: string; details: string };
type ChatMessage = { role: 'user' | 'ai'; text: string };

const UI_COLORS = {
  bgApp: '#cbd5e1',
  bgPanel: '#f1f5f9',
  bgInput: '#e2e8f0',
  textMain: '#0f172a',
  textMuted: '#475569',
  primary: '#2563eb',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  archive: '#64748b',
};

const getTodayFormatted = () => {
  const today = new Date();
  return `${String(today.getDate()).padStart(2, '0')}/${String(
    today.getMonth() + 1
  ).padStart(2, '0')}/${today.getFullYear()}`;
};

const formatDateInput = (value: string) => {
  let val = value.replace(/\D/g, '');
  if (val.length > 8) val = val.slice(0, 8);
  let fmt = val.slice(0, 2);
  if (val.length > 2) fmt += '/' + val.slice(2, 4);
  if (val.length > 4) fmt += '/' + val.slice(4, 8);
  return fmt;
};

export default function App() {
  const [view, setView] = useState<
    | 'home'
    | 'categories'
    | 'products'
    | 'batches'
    | 'cash'
    | 'orders'
    | 'inventory'
    | 'invoice-list'
    | 'invoice-entry'
    | 'invoice-details'
    | 'archive-view'
  >('home');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [cashRecords, setCashRecords] = useState<CashRecord[]>([]);
  const [archives, setArchives] = useState<ArchiveBatch[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<ArchiveBatch | null>(
    null
  );

  const [cashTypes] = useState<CashType[]>([
    { id: 'ct1', name: 'مصروف شخصي', direction: 'out' },
    { id: 'ct2', name: 'فاتورة كهرباء', direction: 'out' },
    { id: 'ct3', name: 'أجار متجر', direction: 'out' },
    { id: 'ct4', name: 'لوازم للمتجر', direction: 'out' },
    { id: 'ct5', name: 'رأس مال / إيداع', direction: 'in' },
    { id: 'ct6', name: 'إيراد مبيعات', direction: 'in' },
  ]);

  const logAction = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: Date.now().toString() + Math.random(),
      time: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev].slice(0, 20));
  };

  const mask = (value: number | string) => {
    if (isPrivacyMode) return '****';
    return Number(value).toLocaleString();
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: cats } = await supabase.from('categories').select('*');
        const { data: prods } = await supabase.from('products').select('*');
        const { data: bts } = await supabase.from('batches').select('*');
        const { data: invs } = await supabase.from('invoices').select('*');
        const { data: cash } = await supabase.from('cash_records').select('*');
        const { data: archs } = await supabase.from('archives').select('*');
        const { data: logs } = await supabase
          .from('audit_logs')
          .select('*')
          .order('time', { ascending: false })
          .limit(20);

        if (cats) setCategories(cats);
        if (prods) setProducts(prods);
        if (bts) setBatches(bts);
        if (invs) setInvoices(invs);
        if (cash) setCashRecords(cash);
        if (archs) setArchives(archs);
        if (logs) setAuditLogs(logs);
      } catch (error) {
        console.error('Error loading data', error);
      } finally {
        setIsLoaded(true);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      const syncData = async () => {
        try {
          if (categories.length > 0)
            await supabase.from('categories').upsert(categories);
          if (products.length > 0)
            await supabase.from('products').upsert(products);
          if (batches.length > 0)
            await supabase.from('batches').upsert(batches);
          if (invoices.length > 0)
            await supabase.from('invoices').upsert(invoices);
          if (cashRecords.length > 0)
            await supabase.from('cash_records').upsert(cashRecords);
          if (archives.length > 0)
            await supabase.from('archives').upsert(archives);
          if (auditLogs.length > 0)
            await supabase.from('audit_logs').upsert(auditLogs);
        } catch (error) {
          console.error('Error syncing data', error);
        }
      };
      const timeoutId = setTimeout(syncData, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [
    categories,
    products,
    batches,
    invoices,
    cashRecords,
    archives,
    auditLogs,
    isLoaded,
  ]);

  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #94a3b8',
    borderRadius: '4px',
    color: UI_COLORS.textMain,
    backgroundColor: UI_COLORS.bgInput,
    textAlign: 'center' as const,
    outline: 'none',
    transition: 'border 0.2s',
  };

  const getFocusStyle = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = UI_COLORS.primary;
    e.currentTarget.style.boxShadow = `0 0 0 2px ${UI_COLORS.primary}40`;
  };
  const getBlurStyle = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = '#94a3b8';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div
      style={{
        fontFamily: 'Tahoma, sans-serif',
        direction: 'rtl',
        backgroundColor: UI_COLORS.bgApp,
        minHeight: '100vh',
      }}
    >
      <header
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          padding: '15px 30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          marginBottom: '20px',
          borderBottom: '2px solid #94a3b8',
          position: 'relative',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div
            onClick={() => setView('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '20px',
              fontWeight: 'bold',
              color: UI_COLORS.primary,
              cursor: 'pointer',
            }}
          >
            🏪 المتجر الذكي
          </div>
          <button
            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
            style={{
              padding: '6px 12px',
              backgroundColor: isPrivacyMode ? UI_COLORS.danger : '#475569',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            {isPrivacyMode ? '🙈 إظهار الأرقام' : '👁️ إخفاء الأرقام'}
          </button>
        </div>
      </header>

      <main style={{ padding: '0 20px 40px' }}>
        {view === 'home' && (
          <HomeView
            setView={setView}
            auditLogs={auditLogs}
            products={products}
            invoices={invoices}
            cashRecords={cashRecords}
            batches={batches}
            mask={mask}
            logAction={logAction}
            setSelectedCategory={setSelectedCategory}
            setSelectedProduct={setSelectedProduct}
            setSelectedInvoice={setSelectedInvoice}
          />
        )}
        {view === 'invoice-list' && (
          <InvoiceListView
            invoices={invoices}
            setInvoices={setInvoices}
            archives={archives}
            setArchives={setArchives}
            onBack={() => setView('home')}
            onNewInvoice={() => {
              setEditingInvoice(null);
              setView('invoice-entry');
            }}
            // تم إصلاح الخطأ هنا
            onViewDetails={(inv: any) => {
              setSelectedInvoice(inv);
              setView('invoice-details');
            }}
            // تم إصلاح الخطأ هنا
            onEditInvoice={(inv: any) => {
              setEditingInvoice(inv);
              setView('invoice-entry');
            }}
            onViewArchive={(arch: any) => {
              setSelectedArchive(arch);
              setView('archive-view');
            }}
            mask={mask}
            logAction={logAction}
          />
        )}
        {view === 'invoice-entry' && (
          <InvoiceEntry
            onBack={() => {
              setEditingInvoice(null);
              setView('invoice-list');
            }}
            inputStyle={inputStyle}
            getFocusStyle={getFocusStyle}
            getBlurStyle={getBlurStyle}
            categories={categories}
            setCategories={setCategories}
            products={products}
            setProducts={setProducts}
            batches={batches}
            setBatches={setBatches}
            invoices={invoices}
            setInvoices={setInvoices}
            editingInvoice={editingInvoice}
            mask={mask}
            logAction={logAction}
          />
        )}
        {view === 'invoice-details' && selectedInvoice && (
          <InvoiceDetailsView
            invoice={selectedInvoice}
            onBack={() => setView('invoice-list')}
            onEdit={() => {
              setEditingInvoice(selectedInvoice);
              setView('invoice-entry');
            }}
            mask={mask}
          />
        )}
        {view === 'archive-view' && selectedArchive && (
          <ArchiveDetailsView
            archive={selectedArchive}
            onBack={() => setView('invoice-list')}
            mask={mask}
          />
        )}
        {view === 'cash' && (
          <CashRegister
            cashRecords={cashRecords}
            setCashRecords={setCashRecords}
            batches={batches}
            onBack={() => setView('home')}
            inputStyle={inputStyle}
            getFocusStyle={getFocusStyle}
            getBlurStyle={getBlurStyle}
            cashTypes={cashTypes}
            mask={mask}
            logAction={logAction}
          />
        )}
        {view === 'categories' && (
          <CategoriesView
            categories={categories}
            setCategories={setCategories}
            setView={setView}
            setSelectedCategory={setSelectedCategory}
            inputStyle={inputStyle}
            getFocusStyle={getFocusStyle}
            getBlurStyle={getBlurStyle}
            logAction={logAction}
          />
        )}
        {view === 'products' && selectedCategory && (
          <ProductsView
            selectedCategory={selectedCategory}
            products={products}
            setProducts={setProducts}
            setView={setView}
            setSelectedProduct={setSelectedProduct}
            inputStyle={inputStyle}
            getFocusStyle={getFocusStyle}
            getBlurStyle={getBlurStyle}
            logAction={logAction}
          />
        )}
        {view === 'batches' && selectedProduct && selectedCategory && (
          <BatchEntry
            product={selectedProduct}
            category={selectedCategory}
            batches={batches.filter((b) => b.productId === selectedProduct.id)}
            allBatches={batches}
            setBatches={setBatches}
            onBack={() => setView('products')}
            inputStyle={inputStyle}
            mask={mask}
            logAction={logAction}
          />
        )}
        {view === 'orders' && <OrderListView onBack={() => setView('home')} />}
        {view === 'inventory' && (
          <InventoryView onBack={() => setView('home')} />
        )}
      </main>
    </div>
  );
}

// ==========================================
// 1. الصفحة الرئيسية
// ==========================================
function HomeView({
  setView,
  auditLogs,
  products,
  invoices,
  cashRecords,
  batches,
  mask,
  setSelectedCategory,
  setSelectedProduct,
  setSelectedInvoice,
}: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'مرحباً! أنا مساعدك الذكي. اسألني عن: "ربح [منتج]"، "صندوق"، أو "عدد المنتجات".',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: any[] = [];
    products
      .filter((p: any) => !p.isArchived && p.name.toLowerCase().includes(q))
      .forEach((p: any) => {
        results.push({
          type: 'product',
          title: p.name,
          subtitle: 'منتج',
          data: p,
        });
      });
    invoices
      .filter(
        (i: any) => !i.isArchived && i.supplierName.toLowerCase().includes(q)
      )
      .forEach((i: any) => {
        results.push({
          type: 'invoice',
          title: i.supplierName,
          subtitle: 'فاتورة',
          data: i,
        });
      });
    setSearchResults(results.slice(0, 5));
  }, [searchQuery, products, invoices]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatHistory((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      let aiResponse =
        "عذراً، لم أفهم. جرب: 'ربح [اسم]'، 'صندوق'، أو 'عدد المنتجات'.";
      const lowerMsg = userMsg.toLowerCase();
      if (lowerMsg.includes('ربح')) {
        const productName = userMsg.replace(/ربح|كم|منتج|ال/g, '').trim();
        const prod = products.find((p: any) => p.name.includes(productName));
        if (prod) {
          const prodBatches = batches.filter(
            (b: any) => b.productId === prod.id && !b.isExcluded
          );
          const totalProfit = prodBatches.reduce((sum: number, b: any) => {
            const R = parseFloat(b.q) > 0 ? parseFloat(b.y) / parseInt(b.q) : 0;
            const E = parseFloat(b.t) - R;
            const I = E * parseInt(b.q);
            const P = parseInt(b.z) * I;
            return sum + (isNaN(P) ? 0 : P);
          }, 0);
          aiResponse = `الربح المتوقع من "${prod.name}" هو: ${mask(
            totalProfit
          )} ل.س.`;
        } else {
          aiResponse = `لم أجد منتجاً باسم "${productName}".`;
        }
      } else if (lowerMsg.includes('صندوق') || lowerMsg.includes('نقد')) {
        const totalPurchases = batches
          .filter((b: any) => !b.isExcluded)
          .reduce(
            (sum: number, b: any) =>
              sum + (parseFloat(b.y) * parseInt(b.z) || 0),
            0
          );
        const activeRecords = cashRecords.filter((r: any) => !r.isArchived);
        const totalOut = activeRecords
          .filter((r: any) => r.direction === 'out')
          .reduce(
            (sum: number, r: any) => sum + (parseFloat(r.amount) || 0),
            0
          );
        const totalIn = activeRecords
          .filter((r: any) => r.direction === 'in')
          .reduce(
            (sum: number, r: any) => sum + (parseFloat(r.amount) || 0),
            0
          );
        aiResponse = `النقد المتوقع في الصندوق: ${mask(
          totalIn - (totalPurchases + totalOut)
        )} ل.س.`;
      } else if (lowerMsg.includes('عدد المنتجات')) {
        aiResponse = `لديك ${
          products.filter((p: any) => !p.isArchived).length
        } منتج نشط.`;
      }
      setChatHistory((prev) => [...prev, { role: 'ai', text: aiResponse }]);
    }, 500);
  };

  const handleResultClick = (res: any) => {
    if (res.type === 'product') {
      setSelectedCategory(
        products.find((c: any) => c.id === res.data.categoryId)
      );
      setSelectedProduct(res.data);
      setView('batches');
    } else if (res.type === 'invoice') {
      setSelectedInvoice(res.data);
      setView('invoice-details');
    }
    setSearchQuery('');
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr 1fr',
        gap: '20px',
        alignItems: 'start',
      }}
    >
      <div
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          padding: '20px',
          borderRadius: '10px',
          border: '1px solid #94a3b8',
        }}
      >
        <h3
          style={{
            marginTop: 0,
            borderBottom: '2px solid #cbd5e1',
            paddingBottom: '10px',
          }}
        >
          📋 سجل الأحداث
        </h3>
        {auditLogs.slice(0, 5).map((log: AuditLog) => (
          <div
            key={log.id}
            style={{
              backgroundColor: UI_COLORS.bgInput,
              padding: '10px',
              borderRadius: '6px',
              borderRight: `4px solid ${UI_COLORS.primary}`,
              marginBottom: '10px',
            }}
          >
            <div style={{ fontSize: '12px', color: UI_COLORS.textMuted }}>
              {log.time}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
              {log.action}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            backgroundColor: UI_COLORS.bgPanel,
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #94a3b8',
            position: 'relative',
          }}
        >
          <h3 style={{ marginTop: 0 }}>🔍 بحث سريع</h3>
          <input
            type="text"
            placeholder="ابحث عن منتج أو مندوب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
            }}
          />
          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100px',
                left: '20px',
                right: '20px',
                backgroundColor: '#fff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                zIndex: 10,
              }}
            >
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => handleResultClick(res)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>{res.title}</span>
                  <span
                    style={{
                      fontSize: '12px',
                      backgroundColor: '#f1f5f9',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {res.subtitle}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            backgroundColor: UI_COLORS.bgPanel,
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #94a3b8',
            height: '350px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              marginTop: 0,
              borderBottom: '2px solid #cbd5e1',
              paddingBottom: '10px',
            }}
          >
            🤖 المساعد الذكي
          </h3>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-start' : 'flex-end',
                  backgroundColor:
                    msg.role === 'user' ? UI_COLORS.primary : '#e2e8f0',
                  color: msg.role === 'user' ? '#fff' : '#000',
                  padding: '10px 15px',
                  borderRadius: '15px',
                  maxWidth: '80%',
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={handleChatSubmit}
            style={{ display: 'flex', gap: '10px', marginTop: '10px' }}
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="اسألني..."
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '20px',
                border: '1px solid #cbd5e1',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: UI_COLORS.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '20px',
              }}
            >
              إرسال
            </button>
          </form>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {[
          { v: 'categories', t: '📦 إدخال منتج' },
          { v: 'invoice-list', t: '🧾 سجل الفواتير' },
          { v: 'inventory', t: '📊 جرد المخزون' },
          { v: 'cash', t: '💰 الصندوق' },
          { v: 'orders', t: '🛒 الطلبات' },
        ].map((btn) => (
          <button
            key={btn.v}
            onClick={() => setView(btn.v as any)}
            style={{
              padding: '20px',
              backgroundColor: UI_COLORS.bgPanel,
              border: '2px solid #94a3b8',
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'right',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: UI_COLORS.primary,
              }}
            >
              {btn.t}
            </span>
            <span>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 2. شاشة الأقسام
// ==========================================
function CategoriesView({
  categories,
  setCategories,
  setView,
  setSelectedCategory,
  inputStyle,
  getFocusStyle,
  getBlurStyle,
  logAction,
}: any) {
  const addCategory = (name: string) => {
    setCategories([
      ...categories,
      { id: Date.now().toString(), name, isArchived: false },
    ]);
    logAction('إضافة قسم', name);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: UI_COLORS.textMuted,
          marginBottom: '20px',
          backgroundColor: UI_COLORS.bgPanel,
          padding: '10px 15px',
          borderRadius: '8px',
          border: '1px solid #94a3b8',
        }}
      >
        <span
          onClick={() => setView('home')}
          style={{ cursor: 'pointer', color: UI_COLORS.primary }}
        >
          الصفحة الرئيسية
        </span>
        <span> &lt; </span>
        <span style={{ fontWeight: 'bold' }}>اختيار القسم</span>
      </div>
      <div
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          padding: '15px',
          borderRadius: '8px',
          display: 'flex',
          gap: '10px',
          border: '1px solid #94a3b8',
          marginBottom: '20px',
        }}
      >
        <input
          id="newCatInput"
          type="text"
          placeholder="اسم القسم الجديد..."
          onFocus={getFocusStyle}
          onBlur={getBlurStyle}
          style={{ ...inputStyle, textAlign: 'right' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              addCategory(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.getElementById(
              'newCatInput'
            ) as HTMLInputElement;
            if (input.value) {
              addCategory(input.value);
              input.value = '';
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: UI_COLORS.primary,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          إضافة
        </button>
      </div>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>اختر القسم</h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '15px',
        }}
      >
        {categories
          .filter((c: any) => !c.isArchived)
          .map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat);
                setView('products');
              }}
              style={{
                padding: '15px',
                backgroundColor: UI_COLORS.bgPanel,
                border: `2px solid #94a3b8`,
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontWeight: 'bold',
                  fontSize: '18px',
                  color: UI_COLORS.primary,
                }}
              >
                {cat.name}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

// ==========================================
// 3. شاشة المنتجات
// ==========================================
function ProductsView({
  selectedCategory,
  products,
  setProducts,
  setView,
  setSelectedProduct,
  inputStyle,
  logAction,
}: any) {
  const addProduct = (name: string) => {
    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        categoryId: selectedCategory.id,
        name,
        isArchived: false,
      },
    ]);
    logAction('إضافة منتج', name);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: UI_COLORS.textMuted,
          marginBottom: '20px',
          backgroundColor: UI_COLORS.bgPanel,
          padding: '10px 15px',
          borderRadius: '8px',
          border: '1px solid #94a3b8',
        }}
      >
        <span
          onClick={() => setView('home')}
          style={{ cursor: 'pointer', color: UI_COLORS.primary }}
        >
          الرئيسية
        </span>
        <span> &lt; </span>
        <span
          onClick={() => setView('categories')}
          style={{ cursor: 'pointer', color: UI_COLORS.primary }}
        >
          الأقسام
        </span>
        <span> &lt; </span>
        <span style={{ fontWeight: 'bold' }}>قسم {selectedCategory.name}</span>
      </div>
      <div
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          padding: '15px',
          borderRadius: '8px',
          display: 'flex',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <input
          id="newProdInput"
          type="text"
          placeholder="اسم المنتج الجديد..."
          style={{ ...inputStyle, textAlign: 'right' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value) {
              addProduct(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <button
          onClick={() => {
            const input = document.getElementById(
              'newProdInput'
            ) as HTMLInputElement;
            if (input.value) {
              addProduct(input.value);
              input.value = '';
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: UI_COLORS.success,
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          إضافة
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '15px',
        }}
      >
        {products
          .filter(
            (p: any) => p.categoryId === selectedCategory.id && !p.isArchived
          )
          .map((prod: any) => (
            <button
              key={prod.id}
              onClick={() => {
                setSelectedProduct(prod);
                setView('batches');
              }}
              style={{
                padding: '15px',
                backgroundColor: UI_COLORS.bgPanel,
                border: '2px solid #94a3b8',
                borderRadius: '8px',
                textAlign: 'right',
              }}
            >
              <span style={{ fontWeight: 'bold', color: UI_COLORS.success }}>
                {prod.name}
              </span>
            </button>
          ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. شاشة إدخال الدفعات
// ==========================================
function BatchEntry({
  product,
  batches,
  allBatches,
  setBatches,
  onBack,
  inputStyle,
  mask,
}: any) {
  const [draft, setDraft] = useState({
    x: '',
    w: '',
    y: '',
    z: '',
    q: '',
    t: '',
  });

  const handleSaveBatch = () => {
    if (!draft.y || !draft.z || !draft.q || !draft.t)
      return alert('أدخل الأرقام الأساسية');
    setBatches([
      ...allBatches,
      {
        id: Date.now().toString(),
        productId: product.id,
        ...draft,
        isExcluded: false,
      },
    ]);
    setDraft({ x: '', w: '', y: '', z: '', q: '', t: '' });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          color: UI_COLORS.textMuted,
          marginBottom: '20px',
          backgroundColor: UI_COLORS.bgPanel,
          padding: '10px 15px',
          borderRadius: '8px',
          border: '1px solid #94a3b8',
        }}
      >
        <span
          onClick={onBack}
          style={{ cursor: 'pointer', color: UI_COLORS.primary }}
        >
          المنتجات
        </span>
        <span> &lt; </span>
        <span style={{ fontWeight: 'bold' }}>{product.name}</span>
      </div>
      <div
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ marginBottom: '10px' }}>إضافة دفعة جديدة</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="تاريخ الشراء"
            value={draft.x}
            onChange={(e) => setDraft({ ...draft, x: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="الصلاحية"
            value={draft.w}
            onChange={(e) => setDraft({ ...draft, w: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="سعر الطرد"
            value={draft.y}
            onChange={(e) => setDraft({ ...draft, y: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="الطرود"
            value={draft.z}
            onChange={(e) => setDraft({ ...draft, z: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="حبات/طرد"
            value={draft.q}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="سعر البيع"
            value={draft.t}
            onChange={(e) => setDraft({ ...draft, t: e.target.value })}
            style={inputStyle}
          />
          <button
            onClick={handleSaveBatch}
            style={{
              padding: '8px 15px',
              backgroundColor: UI_COLORS.primary,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            حفظ
          </button>
        </div>
      </div>
      <div
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          borderRadius: '10px',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: '#334155', color: '#fff' }}>
              <th>تاريخ الشراء</th>
              <th>الصلاحية</th>
              <th>سعر الطرد</th>
              <th>الطرود</th>
              <th>حبات/طرد</th>
              <th>سعر البيع</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b: any) => (
              <tr
                key={b.id}
                style={{
                  borderBottom: '1px solid #cbd5e1',
                  backgroundColor: b.isExcluded ? '#fee2e2' : UI_COLORS.bgInput,
                }}
              >
                <td style={{ padding: '12px' }}>{b.x}</td>
                <td style={{ padding: '12px' }}>{b.w}</td>
                <td style={{ padding: '12px' }}>{b.y}</td>
                <td style={{ padding: '12px' }}>{b.z}</td>
                <td style={{ padding: '12px' }}>{b.q}</td>
                <td style={{ padding: '12px' }}>{b.t}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 5. شاشة الصندوق
// ==========================================
function CashRegister({
  cashRecords,
  setCashRecords,
  onBack,
  inputStyle,
}: any) {
  const [draft, setDraft] = useState({
    amount: '',
    date: getTodayFormatted(),
    note: '',
  });

  const addRecord = () => {
    if (!draft.amount) return;
    setCashRecords([
      ...cashRecords,
      {
        id: Date.now().toString(),
        typeId: 'out',
        typeName: 'مصروف',
        direction: 'out',
        ...draft,
        isArchived: false,
      },
    ]);
    setDraft({ ...draft, amount: '', note: '' });
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '20px',
          backgroundColor: UI_COLORS.bgPanel,
          padding: '10px 15px',
          borderRadius: '8px',
        }}
      >
        <span
          onClick={onBack}
          style={{ cursor: 'pointer', color: UI_COLORS.primary }}
        >
          الصفحة الرئيسية
        </span>
        <span> &lt; </span>
        <span style={{ fontWeight: 'bold' }}>إدارة الصندوق</span>
      </div>
      <div
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h2>إضافة حركة جديدة</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="number"
            placeholder="المبلغ"
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="التاريخ"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            style={inputStyle}
          />
          <input
            type="text"
            placeholder="ملاحظة"
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            style={inputStyle}
          />
          <button
            onClick={addRecord}
            style={{
              padding: '8px 15px',
              backgroundColor: UI_COLORS.danger,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            حفظ
          </button>
        </div>
      </div>
      <div
        style={{
          backgroundColor: UI_COLORS.bgPanel,
          borderRadius: '10px',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', textAlign: 'center' }}>
          <thead>
            <tr style={{ backgroundColor: '#334155', color: '#fff' }}>
              <th>التاريخ</th>
              <th>المبلغ</th>
              <th>ملاحظة</th>
            </tr>
          </thead>
          <tbody>
            {cashRecords.map((e: any) => (
              <tr
                key={e.id}
                style={{
                  borderBottom: '1px solid #cbd5e1',
                  backgroundColor: '#fee2e2',
                }}
              >
                <td style={{ padding: '12px' }}>{e.date}</td>
                <td style={{ padding: '12px' }}>{e.amount}</td>
                <td style={{ padding: '12px' }}>{e.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 6. شاشات الفواتير (مبسطة لتوفير المساحة)
// ==========================================
function InvoiceListView({ onBack, onNewInvoice }: any) {
  return (
    <div>
      <span
        onClick={onBack}
        style={{ cursor: 'pointer', color: UI_COLORS.primary }}
      >
        الرئيسية
      </span>
      <h1>سجل الفواتير</h1>
      <button
        onClick={onNewInvoice}
        style={{
          padding: '10px',
          backgroundColor: UI_COLORS.success,
          color: '#fff',
        }}
      >
        + إدخال فاتورة
      </button>
      <p style={{ marginTop: '20px' }}>(قائمة الفواتير هنا)</p>
    </div>
  );
}

function InvoiceEntry({ onBack }: any) {
  return (
    <div>
      <span
        onClick={onBack}
        style={{ cursor: 'pointer', color: UI_COLORS.primary }}
      >
        رجوع
      </span>
      <h1>إدخال فاتورة جديدة</h1>
      <p>(نموذج إدخال الفاتورة هنا)</p>
    </div>
  );
}

function InvoiceDetailsView({ onBack }: any) {
  return (
    <div>
      <span
        onClick={onBack}
        style={{ cursor: 'pointer', color: UI_COLORS.primary }}
      >
        رجوع
      </span>
      <h1>تفاصيل الفاتورة</h1>
    </div>
  );
}

function ArchiveDetailsView({ onBack }: any) {
  return (
    <div>
      <span
        onClick={onBack}
        style={{ cursor: 'pointer', color: UI_COLORS.primary }}
      >
        رجوع
      </span>
      <h1>الأرشيف</h1>
    </div>
  );
}

function OrderListView({ onBack }: any) {
  return (
    <div>
      <span
        onClick={onBack}
        style={{ cursor: 'pointer', color: UI_COLORS.primary }}
      >
        الرئيسية
      </span>
      <h1>قائمة الطلبات</h1>
    </div>
  );
}

function InventoryView({ onBack }: any) {
  return (
    <div>
      <span
        onClick={onBack}
        style={{ cursor: 'pointer', color: UI_COLORS.primary }}
      >
        الرئيسية
      </span>
      <h1>جرد المخزون</h1>
    </div>
  );
}