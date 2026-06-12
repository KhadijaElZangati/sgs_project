import React, { useEffect } from "react";
import { Printer, X } from "lucide-react";

const LOGO = "/wizaralogo.png";

export default function DocumentPrinter({ doc, onClose }) {
  useEffect(() => {
    if (!doc) return;
    const t = setTimeout(() => { window.print(); }, 600);
    return () => clearTimeout(t);
  }, [doc]);

  if (!doc) return null;

  const isAttestation = doc.type === "attestation_travail";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 flex items-center justify-center print:hidden">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 text-center">
          <Printer size={40} className="mx-auto text-purple-600 mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            {isAttestation ? "Attestation de Travail" : "Certificat Scolaire"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {isAttestation
              ? `Pour ${doc.employee} — ${doc.poste}`
              : `Pour ${doc.student} — ${doc.niveau}`}
          </p>
          <p className="text-xs text-gray-400 mb-5">N° {doc.numero}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { window.print(); }} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700 transition flex items-center gap-2">
              <Printer size={16} /> Imprimer / PDF
            </button>
            <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-200 transition flex items-center gap-2">
              <X size={16} /> Fermer
            </button>
          </div>
        </div>
      </div>

      {isAttestation && (
        <div className="hidden print:block fixed inset-0 z-50 bg-white p-8 text-black font-serif" dir="ltr">
          <div className="max-w-4xl mx-auto">
            <div className="text-center border-b-2 border-gray-900 pb-5 mb-8">
              <img src={LOGO} alt="Logo" className="w-24 h-auto mx-auto mb-3" />
              <h1 className="text-2xl font-black uppercase tracking-wide">Royaume du Maroc</h1>
              <h2 className="text-lg font-bold mt-1">Ministère de l'Éducation Nationale</h2>
              <p className="text-base mt-1">Collège Borj Azaitoune — Marrakech</p>
            </div>

            <h1 className="text-4xl font-black text-center mb-14 uppercase underline underline-offset-8 tracking-wider">
              Attestation de Travail
            </h1>

            <div className="text-lg leading-loose space-y-6 max-w-3xl mx-auto text-justify">
              <p>Je soussigné, Directeur du <strong>Collège Borj Azaitoune</strong>,</p>
              <p>
                Certifie par la présente que <strong>M/Mme {doc.employee}</strong>,
              </p>
              <p>
                Occupant le poste de <strong>{doc.poste}</strong>,
              </p>
              <p>
                Est bel et bien employé(e) au sein de notre établissement.
              </p>
              <p className="mt-6">
                Cette attestation est délivrée à l'intéressé(e) sur sa demande
                pour servir et valoir ce que de droit.
              </p>
            </div>

            <div className="mt-24 text-right text-lg font-bold mr-8">
              <p>Fait à Marrakech, le {doc.date}</p>
              <p className="mt-10">Signature et Cachet du Directeur :</p>
              <div className="mt-4 flex justify-end">
                <div className="w-28 h-28 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-gray-400 text-xs">
                  Cachet
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isAttestation && (
        <div className="hidden print:block fixed inset-0 z-50 bg-white p-8 text-black font-serif" dir="rtl">
          <div className="max-w-4xl mx-auto">
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <img src={LOGO} alt="Logo" className="w-24 h-auto mx-auto mb-3" />
              <p className="text-sm font-bold">المملكة المغربية</p>
              <p className="text-sm font-bold">وزارة التربية الوطنية والتعليم الأولي والرياضة</p>
            </div>

            <div className="flex justify-between text-xs font-bold mb-6">
              <div className="text-left leading-loose">
                <p>الأكاديمية الجهوية للتربية والتكوين</p>
                <p>لجهة : مراكش - آسفي</p>
                <p>المديرية الإقليمية : عمالة : مراكش</p>
              </div>
              <div className="text-right leading-loose">
                <p>الجماعة : المنارة (المقاطعة)</p>
                <p>المؤسسة : الثانوية الإعدادية برج الزيتون</p>
                <p>الهاتف : 0524000000</p>
              </div>
            </div>

            <div className="flex items-center justify-center mb-8">
              <div className="border-2 border-black px-8 py-2.5 text-xl font-black flex items-center gap-4 bg-gray-100">
                <span>شهادة مدرسية رقم : {doc.numero}</span>
              </div>
            </div>

            <div className="text-lg leading-loose font-medium mb-8 max-w-4xl mx-auto">
              <p className="mb-4 font-bold">يشهد الموقع (ة) أسفله</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <p>أن التلميذ (ة) الاسم و النسب : <span className="font-bold border-b border-dashed border-gray-400 inline-block px-4">{doc.student}</span></p>
                <p dir="ltr" className="text-left"><span className="font-bold border-b border-dashed border-gray-400 inline-block px-4">{doc.studentLatin}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <p>تاريخ الازدياد : <span className="font-bold border-b border-dashed border-gray-400 inline-block px-4">{doc.dateNaissance || '................................'}</span></p>
                <p>بـ : <span className="font-bold border-b border-dashed border-gray-400 inline-block px-4">مراكش</span></p>
              </div>

              <p className="mb-4">رقم التلميذ (ة) (مسار) : <span className="font-bold border-b border-dashed border-gray-400 inline-block px-4 tracking-widest">{doc.massarId || '................................'}</span></p>

              <p className="mb-4">كان / يتابع دراسته(ها) بهذه المؤسسة</p>

              <p className="mb-6">و لم يغادر المؤسسة و يتابع دراسته بالمستوى : <span className="font-bold border-b border-dashed border-gray-400 inline-block px-4">{doc.anneeScolaire || '2025/2026'} — {doc.niveau}</span></p>

              <p className="text-base">ملاحظات : <span className="italic">سلمت له (ها) هذه الشهادة من أجل تقديمها للإدارة.</span></p>
            </div>

            <div className="flex justify-between items-end mt-12 px-6">
              <div className="text-center font-bold text-base">
                <p className="mb-6">خاتم و توقيع رئيس المؤسسة</p>
                <div className="w-28 h-28 border-2 border-dashed border-gray-400 rounded-full mx-auto flex items-center justify-center text-gray-400 text-xs">
                  ختم
                </div>
              </div>
              <div className="text-center">
                <p className="text-base font-bold mb-4">حرر بـ : مراكش في : {doc.date}</p>
                <p className="font-bold text-base mb-6">خاتم و توقيع الحارس العام</p>
                <div className="w-28 h-28 border-2 border-dashed border-gray-400 rounded-full mx-auto flex items-center justify-center text-gray-400 text-xs">
                  ختم
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
