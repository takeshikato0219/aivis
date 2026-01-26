import Foundation
import PhotosUI
import React

@objc(PhotoPickerModule)
class PhotoPickerModule: NSObject, PHPickerViewControllerDelegate {

  private var resolve: RCTPromiseResolveBlock?
  private var reject: RCTPromiseRejectBlock?

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // JS gọi hàm này
  @objc(pickImage:rejecter:)
  func pickImage(
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    self.resolve = resolve
    self.reject = reject

    DispatchQueue.main.async {
      var config = PHPickerConfiguration(photoLibrary: .shared())
      config.filter = .images
      config.selectionLimit = 1

      let picker = PHPickerViewController(configuration: config)
      picker.delegate = self

      guard let rootVC = UIApplication.shared.delegate?.window??.rootViewController else {
        reject("NO_VIEW", "Cannot find rootViewController", nil)
        return
      }

      rootVC.present(picker, animated: true)
    }
  }

  // CALLBACK – LẦN ĐẦU CHỌN ẢNH CŨNG VÀO ĐÂY
  func picker(
    _ picker: PHPickerViewController,
    didFinishPicking results: [PHPickerResult]
  ) {
    picker.dismiss(animated: true)

    guard let item = results.first else {
      resolve?(["assets": []])
      return
    }

    let provider = item.itemProvider

    provider.loadObject(ofClass: UIImage.self) { image, error in
      if let error = error {
        self.reject?("LOAD_ERROR", error.localizedDescription, error)
        return
      }

      guard let uiImage = image as? UIImage else {
        self.resolve?(["assets": []])
        return
      }

      let fixedImage = self.fixOrientation(uiImage)

      guard let data = fixedImage.jpegData(compressionQuality: 0.85) else {
        self.resolve?(["assets": []])
        return
      }

      let base64 = data.base64EncodedString()
      let fileSize = data.count

      // Tạo file temp giống ImagePicker
      let fileName = "image_\(Int(Date().timeIntervalSince1970)).jpg"
      let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)

      do {
        try data.write(to: tempURL)
      } catch {
        self.reject?("FILE_WRITE_ERROR", error.localizedDescription, error)
        return
      }

      let asset: [String: Any] = [
        "uri": tempURL.path,
        "fileName": fileName,
        "type": "image/jpeg",
        "fileSize": fileSize,
        "width": fixedImage.size.width,
        "height": fixedImage.size.height,
        "base64": base64
      ]

      self.resolve?([
        "assets": [asset]
      ])
    }
  }

  private func fixOrientation(_ image: UIImage) -> UIImage {
    if image.imageOrientation == .up {
      return image
    }

    UIGraphicsBeginImageContextWithOptions(image.size, false, image.scale)
    image.draw(in: CGRect(origin: .zero, size: image.size))
    let normalizedImage = UIGraphicsGetImageFromCurrentImageContext()
    UIGraphicsEndImageContext()

    return normalizedImage ?? image
  }

}
