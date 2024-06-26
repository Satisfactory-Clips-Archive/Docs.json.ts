import {
	integer_string__signed__type,
	decimal_string__type,
	boolean__type,
} from '../../common/scalar';

import {
	color_decimal__type,
	xyz__integer__type,
	empty_object__type,
	NativeClass__type,
} from '../../common/unassigned';

import {FGBuildable__base__type} from './FGBuildable';

export type FGBuildableBlueprintDesigner__type = FGBuildable__base__type & {
	ClassName?: 'Build_BlueprintDesigner_C';
	mDisplayName?: 'Blueprint Designer';
	mTerminalDistanceFromEdge: decimal_string__type;
	mTerminalHalfDepth: decimal_string__type;
	mDimensions: xyz__integer__type;
	OnRecordDataChanged: empty_object__type;
	OnBlueprintCostChanged: empty_object__type;
	mCurrentCost: '';
	mBuildables: '';
	mIntersectComponents: '';
	mCurrentRecordData: {
		IconID: integer_string__signed__type;
		Color: color_decimal__type;
	};
	mIsDismantlingAll: boolean__type;
};

export type FGBuildableBlueprintDesigner__NativeClass = NativeClass__type & {
	Classes: [FGBuildableBlueprintDesigner__type];
};
