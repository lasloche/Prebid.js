import { expect } from 'chai';
import {addFPDToBidderRequest} from '../../helpers/fpd.js';
import { spec } from 'modules/ccxBidAdapter.js';
import * as utils from 'src/utils.js';

describe('ccxAdapter', function () {
  const bids = [
    {
      adUnitCode: 'banner',
      auctionId: '0b9de793-8eda-481e-a548-c187d58b28d9',
      bidId: '2e56e1af51a5d7',
      bidder: 'ccx',
      bidderRequestId: '17e7b9f58a607e',
      mediaTypes: {
        banner: {
          sizes: [[300, 250]]
        }
      },
      params: {
        placementId: 607
      },
      sizes: [[300, 250]],
      transactionId: 'aefddd38-cfa0-48ab-8bdd-325de4bab5f9'
    },
    {
      adUnitCode: 'video',
      auctionId: '0b9de793-8eda-481e-a548-c187d58b28d9',
      bidId: '3u94t90ut39tt3t',
      bidder: 'ccx',
      bidderRequestId: '23ur20r239r2r',
      mediaTypes: {
        video: {
          playerSize: [[640, 480]]
        }
      },
      params: {
        placementId: 608
      },
      sizes: [[640, 480]],
      transactionId: 'aefddd38-cfa0-48ab-8bdd-325de4bab5f9'
    }
  ];

  describe('isBidRequestValid', function () {
    it('Valid bid requests', function () {
      expect(spec.isBidRequestValid(bids[0])).to.be.true;
      expect(spec.isBidRequestValid(bids[1])).to.be.true;
    });
    it('Invalid bid requests - no placementId', function () {
      const bidsClone = utils.deepClone(bids);
      bidsClone[0].params = undefined;
      expect(spec.isBidRequestValid(bidsClone[0])).to.be.false;
    });
    it('Invalid bid requests - invalid banner sizes', function () {
      const bidsClone = utils.deepClone(bids);
      bidsClone[0].mediaTypes.banner.sizes = [300, 250];
      expect(spec.isBidRequestValid(bidsClone[0])).to.be.false;
      bidsClone[0].mediaTypes.banner.sizes = [[300, 250], [750]];
      expect(spec.isBidRequestValid(bidsClone[0])).to.be.false;
      bidsClone[0].mediaTypes.banner.sizes = [];
      expect(spec.isBidRequestValid(bidsClone[0])).to.be.false;
    });
    it('Invalid bid requests - invalid video sizes', function () {
      const bidsClone = utils.deepClone(bids);
      bidsClone[1].mediaTypes.video.playerSize = [];
      expect(spec.isBidRequestValid(bidsClone[1])).to.be.false;
      bidsClone[1].mediaTypes.video.sizes = [640, 480];
      expect(spec.isBidRequestValid(bidsClone[1])).to.be.false;
    });
    it('Valid bid request - old style sizes', function () {
      const bidsClone = utils.deepClone(bids);
      delete (bidsClone[0].mediaTypes);
      delete (bidsClone[1].mediaTypes);
      expect(spec.isBidRequestValid(bidsClone[0])).to.be.true;
      expect(spec.isBidRequestValid(bidsClone[1])).to.be.true;
      bidsClone[0].sizes = [300, 250];
      expect(spec.isBidRequestValid(bidsClone[0])).to.be.true;
    });
  });

  describe('buildRequests', function () {
    it('No valid bids', function () {
      expect(spec.buildRequests([])).to.be.undefined;
    });

    it('Valid bid request - default', function () {
      const response = spec.buildRequests(bids, {bids, bidderRequestId: 'id'});
      expect(response).to.be.not.empty;
      expect(response.data).to.be.not.empty;

      const data = JSON.parse(response.data);

      expect(data).to.be.an('object');
      expect(data).to.have.keys('site', 'imp', 'id', 'ext', 'device');

      const imps = [
        {
          banner: {
            format: [
              {
                w: 300,
                h: 250
              }
            ]
          },
          ext: {
            pid: 607
          },
          id: '2e56e1af51a5d7',
          secure: 1
        },
        {
          video: {
            w: 640,
            h: 480,
            protocols: [2, 3, 5, 6],
            mimes: ['video/mp4', 'video/x-flv'],
            playbackmethod: [1, 2, 3, 4],
            skip: 0
          },
          id: '3u94t90ut39tt3t',
          secure: 1,
          ext: {
            pid: 608
          }
        }
      ];
      expect(data.imp).to.deep.have.same.members(imps);
    });

    it('Valid bid request - custom', function () {
      const bidsClone = utils.deepClone(bids);
      const imps = [
        {
          banner: {
            format: [
              {
                w: 300,
                h: 250
              }
            ]
          },
          ext: {
            pid: 607
          },
          id: '2e56e1af51a5d7',
          secure: 1
        },
        {
          video: {
            w: 640,
            h: 480,
            protocols: [5, 6],
            mimes: ['video/mp4'],
            playbackmethod: [3],
            skip: 1,
            skipafter: 5
          },
          id: '3u94t90ut39tt3t',
          secure: 1,
          ext: {
            pid: 608
          }
        }
      ];

      bidsClone[1].params.video = {};
      bidsClone[1].params.video.protocols = [5, 6];
      bidsClone[1].params.video.mimes = ['video/mp4'];
      bidsClone[1].params.video.playbackmethod = [3];
      bidsClone[1].params.video.skip = 1;
      bidsClone[1].params.video.skipafter = 5;

      const response = spec.buildRequests(bidsClone, {'bids': bidsClone});
      const data = JSON.parse(response.data);

      expect(data.imp).to.deep.have.same.members(imps);
    });

    it('Valid bid request - sizes old style', function () {
      const bidsClone = utils.deepClone(bids);
      delete (bidsClone[0].mediaTypes);
      delete (bidsClone[1].mediaTypes);
      bidsClone[0].mediaType = 'banner';
      bidsClone[1].mediaType = 'video';

      const imps = [
        {
          banner: {
            format: [
              {
                w: 300,
                h: 250
              }
            ]
          },
          ext: {
            pid: 607
          },
          id: '2e56e1af51a5d7',
          secure: 1
        },
        {
          video: {
            w: 640,
            h: 480,
            protocols: [2, 3, 5, 6],
            mimes: ['video/mp4', 'video/x-flv'],
            playbackmethod: [1, 2, 3, 4],
            skip: 0
          },
          id: '3u94t90ut39tt3t',
          secure: 1,
          ext: {
            pid: 608
          }
        }
      ];

      const response = spec.buildRequests(bidsClone, {'bids': bidsClone});
      const data = JSON.parse(response.data);

      expect(data.imp).to.deep.have.same.members(imps);
    });

    it('Valid bid request - sizes old style - no media type', function () {
      const bidsClone = utils.deepClone(bids);
      delete (bidsClone[0].mediaTypes);
      delete (bidsClone[1]);

      const imps = [
        {
          banner: {
            format: [
              {
                w: 300,
                h: 250
              }
            ]
          },
          ext: {
            pid: 607
          },
          id: '2e56e1af51a5d7',
          secure: 1
        }
      ];

      const response = spec.buildRequests(bidsClone, {'bids': bidsClone});
      const data = JSON.parse(response.data);

      expect(data.imp).to.deep.have.same.members(imps);
    });
  });

  describe('GDPR conformity', function () {
    it('should transmit correct data', function () {
      const bidsClone = utils.deepClone(bids);
      const gdprConsent = {
        consentString: 'awefasdfwefasdfasd',
        gdprApplies: true
      };
      const response = spec.buildRequests(bidsClone, {'bids': bidsClone, 'gdprConsent': gdprConsent});
      const data = JSON.parse(response.data);

      expect(data.regs.ext.gdpr).to.equal(1);
      expect(data.user.ext.consent).to.equal('awefasdfwefasdfasd');
    });
  });

  describe('GDPR absence conformity', function () {
    it('should transmit correct data', function () {
      const response = spec.buildRequests(bids, {bids});
      const data = JSON.parse(response.data);

      expect(data.regs).to.be.undefined;
      expect(data.user).to.be.undefined;
    });
  });

  const response = {
    id: '0b9de793-8eda-481e-a548-c187d58b28d9',
    seatbid: [
      {
        bid: [
          {
            id: '2e56e1af51a5d7_221',
            impid: '2e56e1af51a5d7',
            price: 8.1,
            adid: '221',
            adm: '<script>TEST</script>',
            adomain: ['clickonometrics.com'],
            crid: '221',
            w: 300,
            h: 250,
            ext: {
              type: 'standard'
            }
          },
          {
            id: '2e56e1af51a5d8_222',
            impid: '2e56e1af51a5d8',
            price: 5.68,
            adid: '222',
            adm: '<xml>',
            adomain: ['clickonometrics.com'],
            crid: '222',
            w: 640,
            h: 480,
            ext: {
              type: 'video'
            }
          }
        ]
      }
    ],
    cur: 'PLN',
    ext: {
      ttl: 5,
      usersync: [
        {
          type: 'image',
          url: 'http://foo.sync?param=1'
        },
        {
          type: 'iframe',
          url: 'http://foo.sync?param=2'
        }
      ]
    }
  };

  describe('interpretResponse', function () {
    it('Valid bid response - multi', function () {
      const bidResponses = [
        {
          requestId: '2e56e1af51a5d7',
          cpm: 8.1,
          width: 300,
          height: 250,
          creativeId: '221',
          netRevenue: false,
          ttl: 5,
          currency: 'PLN',
          ad: '<script>TEST</script>',
          meta: {
            advertiserDomains: ['clickonometrics.com']
          }
        },
        {
          requestId: '2e56e1af51a5d8',
          cpm: 5.68,
          width: 640,
          height: 480,
          creativeId: '222',
          netRevenue: false,
          ttl: 5,
          currency: 'PLN',
          vastXml: '<xml>',
          meta: {
            advertiserDomains: ['clickonometrics.com']
          }
        }
      ];
      expect(spec.interpretResponse({body: response})).to.deep.have.same.members(bidResponses);
    });

    it('Valid bid response - single', function () {
      delete response.seatbid[0].bid[1];
      const bidResponses = [
        {
          requestId: '2e56e1af51a5d7',
          cpm: 8.1,
          width: 300,
          height: 250,
          creativeId: '221',
          netRevenue: false,
          ttl: 5,
          currency: 'PLN',
          ad: '<script>TEST</script>',
          meta: {
            advertiserDomains: ['clickonometrics.com']
          }
        }
      ];
      expect(spec.interpretResponse({body: response})).to.deep.have.same.members(bidResponses);
    });

    it('Empty bid response', function () {
      expect(spec.interpretResponse({})).to.be.empty;
    });
  });

  describe('getUserSyncs', function () {
    it('Valid syncs - all', function () {
      const syncOptions = {
        iframeEnabled: true,
        pixelEnabled: true
      };

      const expectedSyncs = [
        {
          type: 'image',
          url: 'http://foo.sync?param=1'
        },
        {
          type: 'iframe',
          url: 'http://foo.sync?param=2'
        }
      ];
      expect(spec.getUserSyncs(syncOptions, [{body: response}])).to.deep.have.same.members(expectedSyncs);
    });

    it('Valid syncs - only image', function () {
      const syncOptions = {
        iframeEnabled: false,
        pixelEnabled: true
      };
      const expectedSyncs = [
        {
          type: 'image', url: 'http://foo.sync?param=1'
        }
      ];
      expect(spec.getUserSyncs(syncOptions, [{body: response}])).to.deep.have.same.members(expectedSyncs);
    });

    it('Valid syncs - only iframe', function () {
      const syncOptions = {iframeEnabled: true, pixelEnabled: false};
      const expectedSyncs = [
        {
          type: 'iframe', url: 'http://foo.sync?param=2'
        }
      ];
      expect(spec.getUserSyncs(syncOptions, [{body: response}])).to.deep.have.same.members(expectedSyncs);
    });

    it('Valid syncs - empty', function () {
      const syncOptions = {iframeEnabled: true, pixelEnabled: true};
      response.ext.usersync = {};
      expect(spec.getUserSyncs(syncOptions, [{body: response}])).to.be.empty;
    });
  });

  describe('mediaTypesVideoParams', function () {
    it('Valid video mediaTypes', function () {
      const bids = [
        {
          adUnitCode: 'video',
          auctionId: '0b9de793-8eda-481e-a548-c187d58b28d9',
          bidId: '3u94t90ut39tt3t',
          bidder: 'ccx',
          bidderRequestId: '23ur20r239r2r',
          mediaTypes: {
            video: {
              playerSize: [[640, 480]],
              protocols: [2, 3, 5, 6],
              mimes: ['video/mp4', 'video/x-flv'],
              playbackmethod: [1, 2, 3, 4],
              skip: 1,
              skipafter: 5
            }
          },
          params: {
            placementId: 608
          },
          sizes: [[640, 480]],
          transactionId: 'aefddd38-cfa0-48ab-8bdd-325de4bab5f9'
        }
      ];

      const imps = [
        {
          video: {
            w: 640,
            h: 480,
            protocols: [2, 3, 5, 6],
            mimes: ['video/mp4', 'video/x-flv'],
            playbackmethod: [1, 2, 3, 4],
            skip: 1,
            skipafter: 5
          },
          id: '3u94t90ut39tt3t',
          secure: 1,
          ext: {
            pid: 608
          }
        }
      ];

      const bidsClone = utils.deepClone(bids);

      const response = spec.buildRequests(bidsClone, {'bids': bidsClone});
      const data = JSON.parse(response.data);

      expect(data.imp).to.deep.have.same.members(imps);
    });
  });

  describe('FLEDGE', function () {
    it('should properly build a request when FLEDGE is enabled', async function () {
      const bidderRequest = {
        paapi: {
          enabled: true
        }
      };
      const bids = [
        {
          adUnitCode: 'banner',
          auctionId: '0b9de793-8eda-481e-a548-aaaaaaaaaaa1',
          bidId: '2e56e1af51ccc1',
          bidder: 'ccx',
          bidderRequestId: '17e7b9f58accc1',
          mediaTypes: {
            banner: {
              sizes: [[300, 250]]
            }
          },
          params: {
            placementId: 609
          },
          sizes: [[300, 250]],
          transactionId: 'befddd38-cfa0-48ab-8bdd-bbbbbbbbbbb1',
          ortb2Imp: {
            ext: {
              ae: 1
            }
          }
        }
      ];

      const ortbRequest = spec.buildRequests(bids, await addFPDToBidderRequest(bidderRequest));
      const data = JSON.parse(ortbRequest.data);
      expect(data.imp[0].ext.ae).to.equal(1);
    });

    it('should properly build a request when FLEDGE is disabled', async function () {
      const bidderRequest = {
        paapi: {
          enabled: false
        }
      };
      const bids = [
        {
          adUnitCode: 'banner',
          auctionId: '0b9de793-8eda-481e-a548-aaaaaaaaaaa2',
          bidId: '2e56e1af51ccc2',
          bidder: 'ccx',
          bidderRequestId: '17e7b9f58accc2',
          mediaTypes: {
            banner: {
              sizes: [[300, 250]]
            }
          },
          params: {
            placementId: 610
          },
          sizes: [[300, 250]],
          transactionId: 'befddd38-cfa0-48ab-8bdd-bbbbbbbbbbb2',
          ortb2Imp: {
            ext: {
              ae: 1
            }
          }
        }
      ];

      const ortbRequest = spec.buildRequests(bids, await addFPDToBidderRequest(bidderRequest));
      const data = JSON.parse(ortbRequest.data);
      expect(data.imp[0].ext.ae).to.be.undefined;
    });
  });
});
