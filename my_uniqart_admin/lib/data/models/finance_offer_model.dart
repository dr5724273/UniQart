import '../../domain/entities/finance_offer_entity.dart';

class FinanceOfferModel extends FinanceOfferEntity {
  const FinanceOfferModel({
    required super.id,
    required super.lenderName,
    required super.lenderEmail,
    required super.totalAmount,
    required super.minLoan,
    required super.maxLoan,
    required super.interestRate,
    required super.durationMonths,
    required super.collateralRequired,
    required super.terms,
    required super.status,
    required super.createdAt,
  });

  factory FinanceOfferModel.fromJson(Map<String, dynamic> json) {
    String lenderName = 'Unknown Lender';
    String lenderEmail = '';

    if (json['lenderId'] is Map) {
      final lenderMap = json['lenderId'] as Map;
      lenderName = (lenderMap['name'] ?? 'Unknown Lender').toString();
      lenderEmail = (lenderMap['email'] ?? '').toString();
    } else if (json['lenderName'] != null) {
      lenderName = json['lenderName'].toString();
    }

    List<int> parsedDurations = [];
    if (json['durationMonths'] is List) {
      parsedDurations = (json['durationMonths'] as List)
          .map((e) => int.tryParse(e.toString()) ?? 0)
          .where((e) => e > 0)
          .toList();
    }

    return FinanceOfferModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      lenderName: lenderName,
      lenderEmail: lenderEmail,
      totalAmount: double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      minLoan: double.tryParse(json['minLoan']?.toString() ?? '0') ?? 0.0,
      maxLoan: double.tryParse(json['maxLoan']?.toString() ?? '0') ?? 0.0,
      interestRate: double.tryParse(json['interestRate']?.toString() ?? '0') ?? 0.0,
      durationMonths: parsedDurations,
      collateralRequired: (json['collateralRequired'] ?? 'other').toString(),
      terms: (json['terms'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      createdAt: (json['createdAt'] ?? '').toString(),
    );
  }
}
