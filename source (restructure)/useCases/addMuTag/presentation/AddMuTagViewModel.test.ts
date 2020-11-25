import { AddMuTagViewModel } from "./AddMuTagViewModel";
import { AddMuTagInteractor } from "../AddMuTagInteractor";

const addMuTagInteractorMocks = {
    addFoundMuTag: jest.fn<Promise<void>, []>(),
    findNewMuTag: jest.fn<Promise<void>, []>(),
    setMuTagName: jest.fn<Promise<void>, [string]>(),
    stopFindingNewMuTag: jest.fn<void, []>()
};
const AddMuTagInteractorMock = jest.fn<AddMuTagInteractor, any>(
    (): AddMuTagInteractor => ({
        addFoundMuTag: addMuTagInteractorMocks.addFoundMuTag,
        findNewMuTag: addMuTagInteractorMocks.findNewMuTag,
        setMuTagName: addMuTagInteractorMocks.setMuTagName,
        stopFindingNewMuTag: addMuTagInteractorMocks.stopFindingNewMuTag
    })
);
const addMuTagInteractorMock = new AddMuTagInteractorMock();

const viewModel = new AddMuTagViewModel(addMuTagInteractorMock);

test("Navigate to Find Mu Tag screen.", async () => {
    expect.assertions(1);
    viewModel.goToFindMuTag();
});
