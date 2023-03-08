import {
  CollectionAdded as CollectionAddedEvent,
  CollectionRemoved as CollectionRemovedEvent,
  CollectionUnverify as CollectionUnverifyEvent,
  CollectionUpdated as CollectionUpdatedEvent,
  CollectionVerify as CollectionVerifyEvent,
  ItemDelisted as ItemDelistedEvent,
  ItemListed as ItemListedEvent,
  ItemSold as ItemSoldEvent,
  ItemUpdated as ItemUpdatedEvent,
  RevenueWithdrawn as RevenueWithdrawnEvent,
} from "../../generated/Marketplace/Marketplace";
import {
  SupportedCollection,
  SaleInfo,
  collection,
  account,
} from "../../generated/schema";
import { store, BigInt } from "@graphprotocol/graph-ts";
import { fetchRegistry, fetchToken } from "../utils/erc721";
import { updateMarketplace } from "./contractUtils";
import { constants } from "../graphprotcol-utls";

export function handleCollectionAdded(event: CollectionAddedEvent): void {
  let collectionEntity = collection.load(event.params._collection.toHex());
  if (collectionEntity != null) {
    let entity = new SupportedCollection(
      "supportedcollection/".concat(collectionEntity.id)
    );
    entity.id = "supportedcollection/".concat(collectionEntity.id);
    entity.feeCollector = event.params.feeCollector;
    entity.royaltyFees = event.params.royaltyFees;
    entity.verificationStatus = event.params.verificationStatus;
    entity.collection = collectionEntity.id;
    entity.save();
  }
}

export function handleCollectionRemoved(event: CollectionRemovedEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    store.remove("SupportedCollection", entity.id);
  }
}

export function handleCollectionUnverify(event: CollectionUnverifyEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    entity.verificationStatus = event.params.verificationStatus;
    entity.save();
  }
}

export function handleCollectionUpdated(event: CollectionUpdatedEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    entity.feeCollector = event.params.feeCollector;
    entity.royaltyFees = event.params.royaltyFees;
    entity.verificationStatus = event.params.verificationStatus;

    entity.save();
  }
}

export function handleCollectionVerify(event: CollectionVerifyEvent): void {
  let entity = SupportedCollection.load(
    "supportedcollection/".concat(event.params._collection.toHex())
  );
  if (entity != null) {
    entity.verificationStatus = event.params.verificationStatus;

    entity.save();
  }
}

export function handleItemDelisted(event: ItemDelistedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let entity = SaleInfo.load("saleinfo/".concat(tokenEntity.id));
    if (entity != null) {
      store.remove("SaleInfo", entity.id);
    }
  }
}

export function handleItemListed(event: ItemListedEvent): void {
  let collectionEntity = fetchRegistry(event.params.collection);
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let entityId = "saleinfo/".concat(tokenEntity.id);
    let entity = SaleInfo.load(entityId);
    if (entity == null) {
      entity = new SaleInfo(entityId);
    }
    entity.id = entityId;
    entity.tokenId = tokenEntity.id;
    entity.collection = collectionEntity.id;
    entity.seller = event.params.seller.toHex();
    entity.salePrice = event.params.price;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;
    entity.state = "fixedSale";
    entity.save();
  }
}

export function handleItemSold(event: ItemSoldEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let entity = SaleInfo.load("saleinfo/".concat(tokenEntity.id));
    updateMarketplace(event);
    let sellerEntity = account.load(event.params.seller.toHex());
    if (sellerEntity != null) {
      sellerEntity.points = sellerEntity.points + 10;
    }
    let buyerEntity = account.load(event.params.buyer.toHex());
    if (buyerEntity != null) {
      buyerEntity.points = buyerEntity.points + 20;
    }
    if (entity != null) {
      store.remove("SaleInfo", entity.id);
    }
  }
}

export function handleItemUpdated(event: ItemUpdatedEvent): void {
  let collectionEntity = collection.load(event.params.collection.toHex());
  if (collectionEntity != null) {
    let timestampBigInt = BigInt.fromI32(event.block.timestamp.toI32());
    let tokenEntity = fetchToken(
      collectionEntity,
      event.params.tokenId,
      timestampBigInt
    );
    let entity = SaleInfo.load("saleinfo/".concat(tokenEntity.id));
    if (entity != null) {
      entity.salePrice = event.params.newPrice;
      entity.blockTimestamp = event.block.timestamp;
      entity.transactionHash = event.transaction.hash;

      entity.save();
    }
  }
}

export function handleRevenueWithdrawn(event: RevenueWithdrawnEvent): void {
  let entity = account.load(event.params.eoa.toHex());
  if (entity != null) {
    let pastRevenue = entity.revenue;
    pastRevenue.plus(event.params.amount);
    entity.revenue = pastRevenue;

    entity.save();
  }
}