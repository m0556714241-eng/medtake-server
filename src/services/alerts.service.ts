import { prisma } from '../db/prisma';
import type { AuthUser } from '../middleware/auth';
import { isLowStock } from '../utils/serializers';

/** מרשמים פעילים במלאי נמוך – מטפל: של כל המטופלים שלו, מטופל: רק שלו */
export const getLowStockAlerts = async (user: AuthUser) => {
  const prescriptions = await prisma.prescription.findMany({
    where: {
      status: 'active',
      ...(user.role === 'patient' ? { patientId: user.id } : { patient: { caregiverId: user.id } }),
    },
    include: { patient: { select: { fullName: true } } },
    orderBy: [{ stockQuantity: 'asc' }, { drugName: 'asc' }],
  });

  return prescriptions.filter(isLowStock).map((p) => ({
    prescriptionId: p.id,
    drugName: p.drugName,
    patientId: p.patientId,
    patientName: p.patient.fullName,
    stockQuantity: p.stockQuantity,
    lowStockThreshold: p.lowStockThreshold,
  }));
};
