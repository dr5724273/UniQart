import '../entities/finance_offer_entity.dart';

abstract class FinanceOfferRepository {
  Future<List<FinanceOfferEntity>> getPendingFinanceOffers({int page = 1, int limit = 20});
  Future<FinanceOfferEntity> submitDecision(String offerId, String action, {String? adminNote});
}
