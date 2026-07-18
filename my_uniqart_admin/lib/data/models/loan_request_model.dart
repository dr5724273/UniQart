import '../../domain/entities/loan_request_entity.dart';

class LoanRequestModel extends LoanRequestEntity {
  const LoanRequestModel({
    required super.id,
    required super.buyerName,
    required super.buyerEmail,
    required super.buyerPhone,
    required super.lenderName,
    required super.lenderEmail,
    required super.requestedAmount,
    required super.durationMonths,
    required super.employmentStatus,
    required super.monthlyIncome,
    required super.collateralType,
    required super.collateralDescription,
    required super.status,
    required super.createdAt,
  });

  factory LoanRequestModel.fromJson(Map<String, dynamic> json) {
    String buyerName = 'Unknown Buyer';
    String buyerEmail = '';
    String buyerPhone = '';

    if (json['buyerId'] is Map) {
      final bMap = json['buyerId'] as Map;
      buyerName = (bMap['name'] ?? 'Unknown Buyer').toString();
      buyerEmail = (bMap['email'] ?? '').toString();
      buyerPhone = (bMap['phone'] ?? '').toString();
    } else if (json['buyerName'] != null) {
      buyerName = json['buyerName'].toString();
    }

    String lenderName = 'Unknown Lender';
    String lenderEmail = '';

    if (json['lenderId'] is Map) {
      final lMap = json['lenderId'] as Map;
      lenderName = (lMap['name'] ?? 'Unknown Lender').toString();
      lenderEmail = (lMap['email'] ?? '').toString();
    } else if (json['lenderName'] != null) {
      lenderName = json['lenderName'].toString();
    }

    return LoanRequestModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      buyerName: buyerName,
      buyerEmail: buyerEmail,
      buyerPhone: buyerPhone,
      lenderName: lenderName,
      lenderEmail: lenderEmail,
      requestedAmount: double.tryParse(json['requestedAmount']?.toString() ?? '0') ?? 0.0,
      durationMonths: int.tryParse(json['durationMonths']?.toString() ?? '12') ?? 12,
      employmentStatus: (json['employmentStatus'] ?? 'Unknown').toString(),
      monthlyIncome: double.tryParse(json['monthlyIncome']?.toString() ?? '0') ?? 0.0,
      collateralType: (json['collateralType'] ?? 'other').toString(),
      collateralDescription: (json['collateralDescription'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      createdAt: (json['createdAt'] ?? '').toString(),
    );
  }
}
