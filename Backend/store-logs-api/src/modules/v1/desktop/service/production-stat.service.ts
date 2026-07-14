import { Injectable } from "@nestjs/common";
import moment = require('moment-timezone');
import { IDecodedToken } from '../../../../common/interfaces/decoded-token.interface';
import { ResponseHelperService } from 'src/common/helper/response.helper.service';
import { IResponse } from '../../../../common/interfaces/response.interface';
import { ProductionStatsModel } from 'src/database/sequelize-db/models/production-stats.model';



@Injectable()
export class ProductionStatsService {
    constructor(
        private readonly responseHelperService: ResponseHelperService,
        private readonly productionStatsModel: ProductionStatsModel
    ) { }

    async getProductionStarts(userData: IDecodedToken): Promise<IResponse> {
        let day = '2020-10-12'
        const productionStarts = await this.productionStatsModel.getproductionStartData(userData.employee_id);
        return productionStarts;
    }
}

/*
setTimeout(() => {
    getProductionStarts({
        id: 17,
        employee_id: 17,
        organization_id: 7,
        admin_id: 7,
        email: 'sumitsingh@globussoft.in',
        name: 'sumit',
        ip: '127.0.0.1',
    }, [
        {
            activityPerSecond: {
                buttonClicks: [0, 0, 0, 7, 0, 7, 0, 0, 0],
                fakeActivities: [0, 3, 0, 0, 0, 0, 0, 0, 0],
                keystrokes: [1, 7, 3, 0, 5, 6, 8, 4, 7],
                mouseMovements: [3, 4, 4, 2, 0, 0, 0, 3, 0]
            },
            mode: { name: 'computer', start: 0, end: 300 },
            timestampInUtc: 1589545463,
            timestampServer: 1589545463,
            timestampActual: 1585996200,
            projectId: 11,
            taskId: 3,
            breakInSeconds: 300,
            taskNote: 'Some custom text here',
            clicksCount: 14,
            fakeActivitiesCount: 3,
            keysCount: 336,
            movementsCount: 44,
            status: 1,
            _id: '5ebe89f77d586a05809e21fb',
            adminId: 7,
            userEmail: 'sumitsingh@globussoft.in',
            userId: 17,
            systemTimeUtc: '2020-04-04T10:30:00.000Z',
            dataId: '2020-04-04T10:30:00.000Z',
            date: '04-04-2020',
            time: '10:30:00',
            appUsage: [
                { "ageOfData": -1, "app": "AnyDesk", "start": 0, "end": 123, "title": "12345678 - AnyDesk", "url": null, "keystrokes": "asdasdsad" },
                { "ageOfData": -1, "app": "Google Chrome", "start": 123, "end": 256, "title": "JSON Editor Online - view, edit", "url": "https://jsoneditoronline.org", "keystrokes": "qweqwretw" }
            ],
            __v: 0,
            createdAt: '2020-05-15T12:24:23.397Z',
            updatedAt: '2020-05-15T12:24:23.397Z'
        },
        {
            activityPerSecond: {
                buttonClicks: [0, 0, 0, 7, 0, 7, 0, 0, 0],
                fakeActivities: [0, 3, 0, 0, 0, 0, 0, 0, 0],
                keystrokes: [1, 7, 3, 0, 5, 6, 8, 4, 7],
                mouseMovements: [3, 4, 4, 2, 0, 0, 0, 3, 0]
            },
            mode: { name: 'computer', start: 0, end: 300 },
            timestampInUtc: 1589545463,
            timestampServer: 1589545463,
            timestampActual: 1585996200,
            projectId: 11,
            taskId: 3,
            breakInSeconds: 300,
            taskNote: 'Some custom text here',
            clicksCount: 14,
            fakeActivitiesCount: 3,
            keysCount: 336,
            movementsCount: 44,
            status: 1,
            _id: '5ebe89f77d586a05809e21fb',
            adminId: 7,
            userEmail: 'sumitsingh@globussoft.in',
            userId: 17,
            systemTimeUtc: '2020-04-04T10:30:00.000Z',
            dataId: '2020-04-04T10:30:00.000Z',
            date: '04-04-2020',
            time: '10:30:00',
            appUsage: [
                { "ageOfData": -1, "app": "AnyDesk", "start": 0, "end": 123, "title": "12345678 - AnyDesk", "url": null, "keystrokes": "asdasdsad" },
                { "ageOfData": -1, "app": "Google Chrome", "start": 123, "end": 256, "title": "JSON Editor Online - view, edit", "url": "https://jsoneditoronline.org", "keystrokes": "qweqwretw" }
            ],
            __v: 0,
            createdAt: '2020-05-15T12:24:23.397Z',
            updatedAt: '2020-05-15T12:24:23.397Z'
        }
    ]);
}, 5000);



*/
[
    {
        "id": "1589488611.0631332", //==> dataId
        "startTime": "2020-05-14T20:36:51",//==>dataId
        "activeSeconds": 180,//==>get it from getActiveAndInactiveAndTotalSeconds;
        "endTime": "2020-05-14T20:40:52",//==>dataId + total (from getActiveAndInactiveAndTotalSeconds;)
        "dataSubmitted": false
    }
]

// let getActiveAndInactiveAndTotalSeconds = (activityPerSecond) => {
//     let activeSeconds = 0, inactiveSeconds = 0;

//     for (let i = 0; i < activityPerSecond.buttonClicks.length; i++) {
//         if (
//             activityPerSecond.buttonClicks[i] == 0 &&
//             activityPerSecond.fakeActivities[i] == 0 &&
//             activityPerSecond.keystrokes[i] == 0 &&
//             activityPerSecond.mouseMovements[i] == 0
//         ) {
//             inactiveSeconds++;
//         } else {
//             activeSeconds++;
//         }
//     }

//     return { total: activeSeconds + inactiveSeconds, active: activeSeconds, inactive: inactiveSeconds };
// }